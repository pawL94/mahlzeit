// Fix #2: use SDK instead of raw fetch
// Fix #1: single source of truth for SYSTEM_PROMPT and MODEL
// Fix #5: updated model version
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

export const SYSTEM_PROMPT = `Du bist ein erfahrener Küchenchef und Ernährungsberater. Du erstellst alltagstaugliche, leckere Rezepte für deutsche Haushalte.

Deine Rezepte sind:
- Vollständig und sättigend (kein Protein ohne Beilage bei herzhaften Gerichten)
- Zeitlich realistisch (du hältst Zeitlimits strikt ein)
- Mengenmäßig korrekt (realistische Haushaltsportionen, keine Restaurantmengen)
- Kreativ aber umsetzbar (keine obskuren Techniken oder Geräte)
- Konsistent (kein stilles Ersetzen von Zutaten, keine Halluzinationen)

Du antwortest IMMER ausschließlich mit validem JSON, niemals mit Markdown oder Erklärungen.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fix #3: single shared JSON parser instead of repeating the pattern 4×
export function parseJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: extract first {...} or [...] block
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]);
    throw new Error("Invalid JSON in API response");
  }
}

export async function callClaude(systemPrompt, userPrompt, maxTokens = 1000) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return message.content[0].text;
}

export async function callClaudeWithImage(prompt, base64, mimeType) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 } },
        { type: "text", text: prompt },
      ],
    }],
  });
  return message.content[0].text;
}

// Fix #2: dedicated streaming function using SDK – no manual SSE parsing
export async function* streamRecipe(prompt) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  for await (const text of stream.textStream) {
    yield text;
  }
}

// ── Trending recipes ──────────────────────────────────────────────────────────
// Fix #4: module-level cache is reliable when using `next start` (persistent process).
// For serverless deployments (Vercel), replace with a KV store.
const TRENDS_URL = "https://raw.githubusercontent.com/pawL94/recipe-trends-/main/trends.json";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const EMBEDDED_TRENDS = {
  "Herzhaft": [
    "Spaghetti Bolognese","Pasta Carbonara","Beef Wellington","Coq au Vin",
    "Wiener Schnitzel","Beef Bourguignon","Moussaka","Beef Stroganoff",
    "Ungarisches Gulasch","Lasagna","Paella","Kung Pao Chicken",
    "General Tso's Chicken","Beef Rendang","Szechuan Beef","Beef Lo Mein",
    "Teriyaki Chicken","Tandoori Chicken","Shawarma","Kebab","Chili con Carne",
    "Gumbo","Jambalaya","Pulled Pork","Barbecue Ribs","Fried Chicken",
    "Jerk Chicken","Jamaican Curry","Cassoulet","Sauerbraten","Maultaschen",
    "Fondue","Raclette","Pierogi","Feijoada","Cochinita Pibil","Mole Poblano",
    "Carne Asada","Tikka Masala","Butter Chicken","Birria Tacos",
    "Marry Me Chicken","Ramen","Bibimbap","Korean Fried Chicken","Bulgogi",
    "Tonkatsu","Schnitzel","Eintopf","Pot-au-Feu","Satay","Tacos",
    "Enchiladas","Empanadas","Asado","Lahmacun","Gyros","Souvlaki",
    "Shakshuka","Pad Thai","Massaman Curry","Thai Green Curry","Panang Curry",
    "Drunken Noodles","Ma Po Tofu","Chicken Karaage","Pho","Banh Mi",
    "Big Mac","Cheeseburger","Reuben Sandwich",
    "Pasta Aglio e Olio","Fettuccine Alfredo","Gnocchi",
  ],
  "Leicht": [
    "Ceviche","Vietnamese Spring Rolls","Gazpacho","Ratatouille","Minestrone",
    "Somtam","Larb","Vietnamese Chicken Salad","Falafel",
    "Bouillabaisse","Sweet and Sour Chicken","Chinese Orange Chicken",
    "Fried Rice","Arepa","Souvlaki","Polenta","Sushi","Caprese Salat","Nicoise Salat",
  ],
  "Dessert": [
    "Tiramisu","Crème Brûlée","Churros","Mousse au Chocolat",
    "Panna Cotta","Baklava","Mochi","Apple Pie","Käsekuchen",
  ],
  "Ueberrasch": [
    "Beef Wellington","Beef Pho","Ma Po Tofu","Drunken Noodles",
    "Bouillabaisse","Cochinita Pibil","Mole Poblano","Larb","Somtam",
    "Fondue","Raclette","Bibimbap","Bulgogi","Tonkatsu","Birria Tacos",
    "Shakshuka","Marry Me Chicken","Korean Fried Chicken",
  ],
};

let liveCache = { clusters: null, fetchedAt: 0 };

export async function getTrendingRecipes(mood) {
  const now = Date.now();
  if (!liveCache.clusters || now - liveCache.fetchedAt > CACHE_TTL) {
    try {
      const resp = await fetch(TRENDS_URL, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.clusters) {
          liveCache = { clusters: data.clusters, fetchedAt: now };
          console.log(`Live trends geladen (${data.updated_date})`);
        }
      }
    } catch(e) {
      // Fallback to embedded trends – intentionally silent
    }
  }

  const clusters = liveCache.clusters || EMBEDDED_TRENDS;
  const moodKey = mood === "Überrasch mich!" ? "Ueberrasch"
    : mood === "Herzhaft" ? "Herzhaft"
    : mood === "Leicht" ? "Leicht"
    : mood === "Dessert" ? "Dessert"
    : "Herzhaft";

  const primary = (clusters[moodKey] || clusters["Herzhaft"] || [])
    .sort(() => Math.random() - 0.5).slice(0, 12);
  const others = Object.entries(clusters)
    .filter(([k]) => k !== moodKey)
    .flatMap(([, v]) => v)
    .sort(() => Math.random() - 0.5).slice(0, 5);

  return [...primary, ...others];
}

export async function buildRecipePrompt(params, trendingRecipes = []) {
  const {
    ingredients, time, mood, portion, intolerances, disliked,
    nope, lovedRecipes, avoidNames, avoidName, weekMode,
    preferredCuisines, availability, devices, mustUse, noShopping
  } = params;

  const timeMap = { "Schnell": "maximal 15 Minuten", "Normal": "maximal 30 Minuten", "Gemütlich": "60 bis 90 Minuten" };
  const timeLimit = timeMap[time] || "maximal 30 Minuten";

  const moodHints = {
    "Herzhaft": "HERZHAFT: Vollständiges, sättigendes Gericht. Protein (Fleisch, Fisch oder Eier – kein Tofu außer Profil ist vegetarisch/vegan) MIT Sättigungsbeilage (Nudeln, Reis, Kartoffeln, Couscous, Brot). Ausnahme: Eintopf/Suppe die selbst sättigt.",
    "Leicht": "LEICHT: Wenig Kalorien, viel Gemüse, keine schweren Saucen, moderate Kohlenhydrate.",
    "Dessert": "DESSERT: Eine Nachspeise oder ein süßes Hauptgericht.",
    "Überrasch mich!": "ÜBERRASCHUNG: Wähle völlig frei – überrasche mit einer ungewöhnlichen, kreativen Idee die man so nicht erwartet.",
  };
  const moodHint = moodHints[mood] || "";

  const allCuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch","Spanisch","Koreanisch","Vietnamesisch","Libanesisch"];
  const cuisinePool = (preferredCuisines?.length > 0) ? preferredCuisines : allCuisines;
  const entropy = avoidName ? avoidName.length : 0;
  const cuisineIdx = (Math.floor(Math.random() * cuisinePool.length) + entropy) % cuisinePool.length;
  const cuisine = cuisinePool[cuisineIdx];
  const reqId = Math.random().toString(36).substring(7);

  const ingList = ingredients?.length > 0
    ? ingredients.join(", ")
    : "keine Vorgabe – wähle ein passendes Gericht";

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

  const availHint = {
    "supermarkt": "Nur Zutaten die in jedem normalen deutschen Supermarkt (Rewe, Edeka, Lidl, Aldi) erhältlich sind.",
    "markt": "Zutaten aus gut sortiertem Supermarkt erlaubt (z.B. Miso, Tahini, Kokosmilch).",
    "alles": "Alle Zutaten erlaubt, auch aus Spezialgeschäften.",
  }[availability] || "Nur Zutaten aus normalem Supermarkt.";

  const deviceMap = {
    "Airfryer (1 Korb)": "AIRFRYER (1 Korb): Hauptkomponente im Airfryer – Temperatur in °C und Zeit in Minuten angeben, Vorheizen erwähnen. Beilage (Reis/Nudeln/Kartoffeln) parallel im Topf ist ausdrücklich erwünscht. KEINE Pfanne oder Backofen für die Hauptkomponente.",
    "Airfryer (2 Körbe)": "AIRFRYER (2 Körbe): Protein in Korb 1, Gemüse oder Beilage in Korb 2 – jeweils mit °C und Minuten. Bei Bedarf zusätzlich Nudeln/Reis im Topf. Beide Körbe werden gleichzeitig genutzt.",
    "Thermomix": "THERMOMIX: Alle Schritte mit konkreten TM-Funktionen formulieren (z.B. 'Stufe 4, 100°C, 10 Min' oder 'Varoma, Stufe 2, 20 Min'). KEINE Pfanne oder Backofen parallel.",
  };

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
