export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `Du bist ein erfahrener Küchenchef und Ernährungsberater. Du erstellst alltagstaugliche, leckere Rezepte für deutsche Haushalte.

Deine Rezepte sind:
- Vollständig und sättigend (kein Protein ohne Beilage bei herzhaften Gerichten)
- Zeitlich realistisch (du hältst Zeitlimits strikt ein)
- Mengenmäßig korrekt (realistische Haushaltsportionen, keine Restaurantmengen)
- Kreativ aber umsetzbar (keine obskuren Techniken oder Geräte)
- Konsistent (kein stilles Ersetzen von Zutaten, keine Halluzinationen)

Du antwortest IMMER ausschließlich mit validem JSON, niemals mit Markdown oder Erklärungen.`;

async function callClaude(systemPrompt, userPrompt, maxTokens = 1000) {
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "API error");
  return data.content[0].text;
}

async function callClaudeWithImage(prompt, base64, mimeType) {
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "API error");
  return data.content[0].text;
}

// ── Trending recipes cache ───────────────────────────────
let trendingCache = { recipes: [], fetchedAt: 0 };
const TRENDS_URL = "https://raw.githubusercontent.com/pawL94/recipe-trends/main/trends.json";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 Stunden

export async function getTrendingRecipes() {
  const now = Date.now();
  if (trendingCache.recipes.length > 0 && now - trendingCache.fetchedAt < CACHE_TTL) {
    return trendingCache.recipes;
  }
  try {
    const resp = await fetch(TRENDS_URL, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return trendingCache.recipes;
    const data = await resp.json();
    if (data.recipes?.length > 0) {
      trendingCache = { recipes: data.recipes, fetchedAt: now };
      console.log(`Trends geladen: ${data.recipes.length} Rezepte (${data.updated_date})`);
    }
    return trendingCache.recipes;
  } catch(e) {
    console.log("Trends nicht erreichbar, nutze Cache:", e.message);
    return trendingCache.recipes;
  }
}

// ── Canonical recipe prompt builder ──────────────────────
// Used by BOTH the normal endpoint AND stream.js
export async function buildRecipePrompt(params, trendingRecipes = []) {
  const {
    ingredients, time, mood, portion, intolerances, disliked,
    nope, lovedRecipes, avoidNames, avoidName, weekMode,
    preferredCuisines, availability, devices, mustUse, noShopping
  } = params;

  const timeMap = {
    "Schnell": "maximal 15 Minuten",
    "Normal": "maximal 30 Minuten",
    "Gemütlich": "60 bis 90 Minuten"
  };
  const timeLimit = timeMap[time] || "maximal 30 Minuten";

  // Mood-specific requirements
  const moodHints = {
    "Herzhaft": "HERZHAFT: Vollständiges, sättigendes Gericht. Protein (Fleisch, Fisch oder Eier – kein Tofu außer Profil ist vegetarisch/vegan) MIT Sättigungsbeilage (Nudeln, Reis, Kartoffeln, Couscous, Brot). Ausnahme: Eintopf/Suppe die selbst sättigt.",
    "Leicht": "LEICHT: Wenig Kalorien, viel Gemüse, keine schweren Saucen, moderate Kohlenhydrate.",
    "Dessert": "DESSERT: Eine Nachspeise oder ein süßes Hauptgericht.",
    "Überrasch mich!": "ÜBERRASCHUNG: Wähle völlig frei – überrasche mit einer ungewöhnlichen, kreativen Idee die man so nicht erwartet.",
  };
  const moodHint = moodHints[mood] || "";

  // Cuisine selection
  const allCuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch","Spanisch","Koreanisch","Vietnamesisch","Libanesisch"];
  const cuisinePool = (preferredCuisines?.length > 0) ? preferredCuisines : allCuisines;
  // For "anderes_gericht": filter out the avoided name's cuisine by using more entropy
  const entropy = avoidName ? avoidName.length : 0;
  const cuisineIdx = (Math.floor(Math.random() * cuisinePool.length) + entropy) % cuisinePool.length;
  const cuisine = cuisinePool[cuisineIdx];
  const reqId = Math.random().toString(36).substring(7);

  const ingList = ingredients?.length > 0
    ? ingredients.join(", ")
    : "keine Vorgabe – wähle ein passendes Gericht";

  // Intolerances
  const intoleranceMap = {
    "Laktosefrei": "KEIN normaler Käse (Mozzarella, Feta, Gouda etc.), keine normale Milch/Sahne/Joghurt/Butter – laktosefreie Alternative ODER komplett ohne Milchprodukte",
    "Glutenfrei": "Kein Weizen/Gluten – glutenfreie Alternative ODER Gericht von Natur aus glutenfrei (Reis, Kartoffeln, Fleisch, Gemüse)",
    "Vegetarisch": "Kein Fleisch, kein Fisch. Eier und Milchprodukte erlaubt",
    "Vegan": "Keine tierischen Produkte (kein Fleisch, Fisch, Eier, Milch, Honig)",
    "Kein Fisch": "Kein Fisch, keine Meeresfrüchte",
    "Kein Schweinefleisch": "Kein Schweinefleisch und keine Schweinefleischprodukte",
    "Nussallergie": "Keine Nüsse jeglicher Art",
    "Eierallergie": "Keine Eier",
    "Sojaallergie": "Kein Soja",
    "Keine Meeresfrüchte": "Keine Meeresfrüchte (Garnelen, Muscheln etc.)",
  };

  // Availability
  const availHint = {
    "supermarkt": "Nur Zutaten die in jedem normalen deutschen Supermarkt (Rewe, Edeka, Lidl, Aldi) erhältlich sind.",
    "markt": "Zutaten aus gut sortiertem Supermarkt erlaubt (z.B. Miso, Tahini, Kokosmilch).",
    "alles": "Alle Zutaten erlaubt, auch aus Spezialgeschäften.",
  }[availability] || "Nur Zutaten aus normalem Supermarkt.";

  // Device hints
  const deviceMap = {
    "Airfryer (1 Korb)": "AIRFRYER (1 Korb): Hauptkomponente im Airfryer – Temperatur in °C und Zeit in Minuten angeben, Vorheizen erwähnen. Beilage (Reis/Nudeln/Kartoffeln) parallel im Topf ist ausdrücklich erwünscht. KEINE Pfanne oder Backofen für die Hauptkomponente.",
    "Airfryer (2 Körbe)": "AIRFRYER (2 Körbe): Protein in Korb 1, Gemüse oder Beilage in Korb 2 – jeweils mit °C und Minuten. Bei Bedarf zusätzlich Nudeln/Reis im Topf. Beide Körbe werden gleichzeitig genutzt.",
    "Thermomix": "THERMOMIX: Alle Schritte mit konkreten TM-Funktionen formulieren (z.B. 'Stufe 4, 100°C, 10 Min' oder 'Varoma, Stufe 2, 20 Min'). KEINE Pfanne oder Backofen parallel.",
  };

  // Build context lines
  const lines = [];
  if (moodHint) lines.push(moodHint);
  lines.push(availHint);
  if (intolerances?.length > 0) {
    lines.push("UNVERTRÄGLICHKEITEN (absolute Priorität – überschreiben alles andere):\n" +
      intolerances.map(i => "• " + (intoleranceMap[i] || "Vermeiden: " + i)).join("\n"));
  }
  if (disliked?.length > 0) lines.push("Heute nicht gewünscht: " + disliked.join(", "));
  if (mustUse?.length > 0) lines.push("PFLICHT-ZUTATEN (bald ablaufend – MÜSSEN im Rezept vorkommen): " + mustUse.join(", "));
  if (noShopping) lines.push("KEIN EINKAUF: Nur vorhandene Zutaten verwenden. Grundzutaten (Salz, Pfeffer, Öl, Butter, Mehl, Gewürze) dürfen vorausgesetzt werden.");
  if (avoidName) lines.push(`ABGELEHNT: "${avoidName}" – schlage etwas KOMPLETT anderes vor, anderer Stil und andere Hauptzutaten.`);
  if (avoidNames?.length > 0) lines.push("NICHT WIEDERHOLEN: " + avoidNames.join(", "));
  if (nope === "zu_aufwendig") lines.push("VEREINFACHEN: Das vorherige Gericht war zu aufwendig. Wähle etwas deutlich einfacheres mit weniger Schritten.");
  if (nope === "anderes_gericht") lines.push("ANDERE KÜCHE PFLICHT: Heute unbedingt " + cuisine + " – komplett anderer Stil als zuletzt.");
  if (lovedRecipes?.length > 0) lines.push("Lieblingsgerichte des Nutzers (Stil berücksichtigen, aber NICHT wiederholen): " + lovedRecipes.join(", "));
  if (trendingRecipes?.length > 0) {
    // Pick a random sample of trending recipes as inspiration (not mandatory)
    const sample = trendingRecipes.sort(() => Math.random() - 0.5).slice(0, 15);
    lines.push("TRENDING: Aktuell beliebte Gerichte weltweit (als Inspiration – nur nutzen wenn es zur Stimmung und Küche passt): " + sample.join(", "));
  }
  if (weekMode) lines.push("WOCHENPLANUNG: Ausgewogenes Abendessen. Jede Hauptzutat max. 2x pro Woche. Heute: " + cuisine);
  if (devices?.length > 0) lines.push(devices.map(d => deviceMap[d] || "Gerät: " + d).join("\n"));

  const portionText = `${portion} ${portion == 1 ? "Person" : "Personen"}`;

  const prompt = `Erstelle ein Rezept mit folgenden Vorgaben:

Vorhandene Zutaten: ${ingList}
Zeitlimit: ${timeLimit} – STRIKT einhalten!
Stimmung: ${mood}
Portionen: ${portionText}
Küche: ${cuisine}

${lines.join("\n\n")}

REGELN:
1. Zeitlimit ${timeLimit} NIEMALS überschreiten.
2. Vorhandene Zutaten als Basis nutzen – 1-2 reichen oft, Qualität vor Quantität.
3. available:true NUR wenn die Zutat EXAKT so in der Vorratsliste steht. Ohne Vorratsliste: available IMMER false.
4. ${nope === "anderes_gericht" ? cuisine + " – PFLICHT!" : "Küche " + cuisine + " soll das Gericht prägen."}
5. Kreativ und überraschend – kein 08/15. Das Gericht soll begeistern.
6. Zutaten NIE still ersetzen oder erfinden. Nicht vorhandene Zutaten → available:false.
7. Unverträglichkeiten haben ABSOLUTE PRIORITÄT – sie überschreiben Vorratszutaten.
8. Realistische Portionsmengen: ~80-100g Pasta, ~150g Fleisch, ~200g Gemüse pro Person.
9. ${moodHint ? "Stimmungs-Anforderung strikt erfüllen: " + mood : "Gericht zur gewählten Stimmung passend."}

Antworte NUR mit diesem JSON-Format:
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

  return { prompt, reqId };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, ...params } = req.body;

  try {
    // ── Scan ──────────────────────────────────────────────
    if (type === "scan") {
      const { base64, mimeType } = params;
      const text = await callClaudeWithImage(
        'Analysiere dieses Foto eines Kühlschranks. Erkenne nur Lebensmittel die du KLAR und SICHER erkennen kannst. REGELN: 1. Nur konkrete Lebensmittel (Mozzarella, Karotten, Milch) – KEINE Markennamen (Alnatura, Knorr, Pringles). 2. Nur nennen was wirklich sichtbar ist – lieber weniger als halluzinieren. 3. Unscharfe/unklare Produkte weglassen. 4. Spezifisch: Mozzarella nicht Käse, Feta nicht Käse. Antworte NUR mit JSON-Array auf Deutsch: ["Mozzarella","Karotten"]. Kein Markdown.',
        base64, mimeType
      );
      const found = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ ingredients: found });
    }

    // ── Recipe (non-streaming) ────────────────────────────
    if (type === "recipe") {
      const trending = await getTrendingRecipes();
      const { prompt } = await buildRecipePrompt(params, trending);
      const text = await callClaude(SYSTEM_PROMPT, prompt, 1200);
      const recipe = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ recipe });
    }

    // ── Combine shopping list ─────────────────────────────
    if (type === "combine-shopping") {
      const { items } = params;
      const itemList = items.map(i => `- ${i.name}: ${i.amount} (${i.day})`).join("\n");
      const prompt = `Erstelle eine kombinierte Einkaufsliste aus diesen Wochenplan-Zutaten:\n\n${itemList}\n\nREGELN:\n1. Gleiche Zutat + gleiche Einheit → addieren (200g + 300g = 500g)\n2. Verschiedene Einheiten umrechnen: 1 EL = 15ml = 3 TL, ab 1000g → kg\n3. "nach Bedarf" nur einmal\n4. Sortieren: Gemüse & Obst / Fleisch & Fisch / Milchprodukte & Eier / Trockenwaren & Gewürze / Sonstiges\n\nNur JSON:\n{"categories":[{"name":"Gemüse & Obst","items":[{"name":"Tomate","amount":"5 Stück"}]}]}`;
      const text = await callClaude(SYSTEM_PROMPT, prompt, 800);
      const result = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json(result);
    }

    // ── Scale recipe ──────────────────────────────────────
    if (type === "scale") {
      const { recipe, fromPersons, toPersons } = params;
      const ingList = recipe.ingredients.map(i => `- ${i.name}: ${i.amount}`).join("\n");
      const stepsText = recipe.steps.map((s,i) => `${i+1}. ${s}`).join("\n");
      const prompt = `Passe dieses Rezept von ${fromPersons} auf ${toPersons} ${toPersons===1?"Person":"Personen"} an.\n\nZutaten (für ${fromPersons} ${fromPersons===1?"Person":"Personen"}):\n${ingList}\n\nZubereitung:\n${stepsText}\n\nREGELN:\n1. Mengen sinnvoll skalieren – nicht stupide multiplizieren\n2. Gewürze/Salz skalieren schwächer (×1.5 statt ×3)\n3. Garzeiten ändern sich kaum – erwähne Ausnahmen\n4. Ganze Einheiten runden (1.5 Eier → 2 Eier)\n5. available-Status unverändert beibehalten\n\nNur JSON:\n{"ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;
      const text = await callClaude(SYSTEM_PROMPT, prompt, 900);
      const scaled = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ recipe: { ...recipe, ...scaled } });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
