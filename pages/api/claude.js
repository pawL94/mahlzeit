export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

async function callClaude(prompt, maxTokens = 1000) {
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
      messages: [{ role: "user", content: prompt }],
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, ...params } = req.body;

  try {
    // ── Scan ──────────────────────────────────────────────
    if (type === "scan") {
      const { base64, mimeType } = params;
      const text = await callClaudeWithImage(
        'Analysiere dieses Foto eines Kuehlschranks. Erkenne nur Lebensmittel und Zutaten die du KLAR und SICHER erkennen kannst. WICHTIGE REGELN: 1. Nur konkrete Lebensmittel nennen: Mozzarella, Karotten, Milch - KEINE Markennamen wie Alnatura, Rewe oder Pringles. 2. Nur nennen was du wirklich siehst - lieber weniger als halluzinieren. 3. Bei unscharfen oder unklaren Produkten: weglassen. 4. Produktnamen konkret: Mozzarella nicht Kaese, Feta nicht Kaese. Antworte NUR mit JSON-Array auf Deutsch: ["Mozzarella","Karotten","Milch"]. Kein Markdown.',
        base64, mimeType
      );
      const found = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ ingredients: found });
    }

    // ── Recipe ────────────────────────────────────────────
    if (type === "recipe") {
      const { ingredients, time, mood, portion, intolerances, disliked, nope, lovedRecipes, avoidNames, avoidName, weekMode, preferredCuisines, availability, devices } = params;

      const timeMap = { "Schnell": "maximal 15 Minuten", "Normal": "maximal 30 Minuten", "Gemütlich": "60 bis 90 Minuten" };
      const timeLimit = timeMap[time] || "maximal 30 Minuten";
      const moodHints = {
        "Herzhaft": "Herzhaft: sattmachendes vollstaendiges Gericht. Protein = Fleisch, Fisch oder Eier (kein Tofu ausser explizit vegetarisch). PFLICHT: Saettigungsbeilage dazu (Nudeln, Reis, Kartoffeln, Couscous, Brot) – ausser das Gericht ist ein Eintopf/Suppe der selbst saettigt.",
        "Leicht": "Leicht: wenig Kalorien, viel Gemuese, keine schweren Saucen oder grossen Kohlenhydrat-Portionen.",
        "Dessert": "Dessert: eine Nachspeise oder suesses Gericht.",
        "Ueberrasch mich!": "Freie Wahl – ueberrasche mit einer ungewoehnlichen kreativen Idee.",
      };
      const moodHint = moodHints[mood] || "";

      const allCuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch","Spanisch","Koreanisch","Vietnamesisch","Libanesisch"];
      // Use preferred cuisines from profile if set, otherwise all cuisines
      const cuisinePool = (preferredCuisines && preferredCuisines.length > 0) ? preferredCuisines : allCuisines;
      const cuisine = cuisinePool[Math.floor(Math.random() * cuisinePool.length)];
      const reqId = Math.random().toString(36).substring(7);

      const ingList = ingredients?.length > 0 ? ingredients.join(", ") : "keine – wähle ein kreatives Gericht";

      const intoleranceMap = {
        "Laktosefrei": "LAKTOSEFREI: Keine normalen Milchprodukte! Normaler Käse (Mozzarella, Feta, Parmesan, Gouda etc.), normale Milch, normaler Joghurt, normale Sahne und Butter enthalten Laktose. Erlaubt: explizit laktosefreie Produkte (laktosefreie Milch, laktosefreier Joghurt) ODER Gerichte die komplett ohne Milchprodukte auskommen. Im Zweifel: kein Milchprodukt verwenden.",
        "Glutenfrei": "Gluten: glutenfreie Alternativen ODER Gerichte ohne Gluten.",
        "Vegetarisch": "Kein Fleisch, kein Fisch. Eier/Milch erlaubt.",
        "Vegan": "Keine tierischen Produkte.",
        "Kein Fleisch": "Kein Fleisch.",
        "Kein Fisch": "Kein Fisch/Meeresfrüchte.",
        "Kein Schweinefleisch": "Kein Schweinefleisch.",
        "Nussallergie": "Keine Nüsse.",
        "Eierallergie": "Keine Eier.",
        "Sojaallergie": "Kein Soja.",
        "Keine Meeresfrüchte": "Keine Meeresfrüchte.",
      };

      const availabilityHint = availability === "supermarkt"
        ? "Nur Zutaten aus normalem Supermarkt (Rewe/Edeka/Lidl) – keine Spezialgeschäfte."
        : availability === "markt"
        ? "Zutaten aus gut sortiertem Supermarkt erlaubt (Miso, Tahini, Kokosmilch ok)."
        : "Alle Zutaten erlaubt.";

      const lines = [];
      if(moodHint) lines.push(moodHint);
      lines.push(availabilityHint);
      if (intolerances?.length > 0) lines.push("UNVERTRÄGLICHKEITEN: " + intolerances.map(i => intoleranceMap[i] || "Vermeiden: " + i).join(" | "));
      if (disliked?.length > 0) lines.push("Heute nicht gewünscht: " + disliked.join(", "));
      if (avoidName) lines.push(`"${avoidName}" wurde abgelehnt – schlage etwas KOMPLETT anderes vor!`);
      if (avoidNames?.length > 0) lines.push("Diese Woche nicht wiederholen: " + avoidNames.join(", "));
      if (nope === "zu_aufwendig") lines.push("Zu aufwendig → DEUTLICH einfacheres Gericht, weniger Zutaten/Schritte.");
      if (nope === "anderes_gericht") lines.push("Falscher Stil → VÖLLIG andere Küche. Heute unbedingt: " + cuisine);
      if (lovedRecipes?.length > 0) lines.push("Lieblingsgerichte (nicht wiederholen, aber Stil nutzen): " + lovedRecipes.join(", "));
      if (weekMode) lines.push("Wochenplanung: ausgewogenes Abendessen. WICHTIG: Die verfügbaren Zutaten sind der Wochenvorrat – jede einzelne Zutat darf NUR in maximal 2 von 7 Gerichten vorkommen. Nutze heute NUR 1-2 der verfügbaren Zutaten und wähle die Küche " + cuisine + " – auch wenn diese Küche die Zutaten normalerweise nicht verwendet.");
      if (devices?.length > 0) {
        const deviceHints = {
          "Airfryer (1 Korb)": "Airfryer: Hauptkomponente (Protein) im Airfryer mit °C und Min. Beilage (Reis, Nudeln, Kartoffeln) parallel im Topf – das ist erwünscht und macht das Gericht vollstaendig. Keine Pfanne oder Backofen fuer die Hauptkomponente.",
          "Airfryer (2 Körbe)": "Dual-Basket Airfryer: Protein in Korb 1, Gemuese oder Beilage in Korb 2 – je mit °C und Min. Bei Bedarf zusaetzlich Nudeln/Reis im Topf. Das Gericht muss vollstaendig und saettigend sein.",
          "Thermomix": "Thermomix: alle Schritte mit TM-Funktionen (Stufe/°C/Min/Varoma). Keine Pfanne/Backofen parallel.",
        };
        const deviceList = devices.map(d => deviceHints[d] || ("Gerät nutzen: " + d)).join(" | ");
        lines.push("KÜCHENGERÄTE HEUTE: " + deviceList);
      }

      const prompt = `Du bist ein kreativer Küchenchef. [${reqId}]

Zutaten: ${ingList}
ZEITLIMIT: ${timeLimit} – strikt einhalten!
Stimmung: ${mood} | Personen: ${portion}
${lines.join("\n")}

REGELN:
1. Zeitlimit ${timeLimit} NICHT überschreiten.
2. Nutze maximal 1-2 der verfügbaren Zutaten – nicht mehr! Sei sehr selektiv.
3. available:true NUR wenn Zutat EXAKT in der Zutaten-Liste steht. Im Zweifel false.
4. Küche: ${nope === "anderes_gericht" ? cuisine + " – PFLICHT!" : cuisine} – diese Küche MUSS das Gericht prägen.
5. Kreativ, keine Standardgerichte. Das Gericht soll zur Küche passen, nicht zur Zutatenliste.
6. Zutaten NICHT still ersetzen: Wenn eine Vorratszutat nicht passt einfach ignorieren und anderes Gericht wählen.
7. Unvertraeglichkeiten haben ABSOLUTE PRIORITAET und ueberschreiben jede Vorratszutat.

Antworte NUR mit JSON (kein Markdown):
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const text = await callClaude(prompt, 1000);
      const recipe = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ recipe });
    }

    // ── Combine shopping list ─────────────────────────────
    if (type === "combine-shopping") {
      const { items } = params;
      // items = [{name, amount, day}, ...]
      const itemList = items.map(i => `- ${i.name}: ${i.amount} (${i.day})`).join("\n");
      const prompt = `Du bist ein präziser Einkaufshelfer. Hier sind alle benötigten Zutaten aus einem Wochenplan:

${itemList}

Aufgabe: Erstelle eine saubere, kombinierte Einkaufsliste.

REGELN:
1. Gleiche Zutat, gleiche Einheit → Mengen addieren. Beispiel: 200g + 300g = 500g
2. Gleiche Zutat, verschiedene Einheiten → in die größere/praktischere Einheit umrechnen und addieren:
   - ml und EL: 1 EL = 15ml. Beispiel: 60ml + 2 EL = 60ml + 30ml = 90ml
   - g und kg: unter 1000g in g angeben, ab 1000g in kg
   - TL und EL: 1 EL = 3 TL
   - Stück/Scheiben/Zehen: als Stück summieren
3. Vage Mengen wie "nach Bedarf", "etwas", "Prise" → nur einmal aufführen als "nach Bedarf"
4. Nach Kategorie sortieren: Gemüse & Obst, Fleisch & Fisch, Milchprodukte & Eier, Trockenwaren & Gewürze, Sonstiges
5. Jede Zutat nur einmal in der Liste, auch wenn sie an mehreren Tagen vorkommt

Antworte NUR mit JSON (kein Markdown):
{"categories":[{"name":"Gemüse & Obst","items":[{"name":"Tomate","amount":"5 Stück"}]}]}`;

      const text = await callClaude(prompt, 800);
      const result = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, "").trim());
      return res.status(200).json(result);
    }

    // ── Scale recipe ──────────────────────────────────────
    if (type === "scale") {
      const { recipe, fromPersons, toPersons } = params;
      const ingredientList = recipe.ingredients.map(i => `- ${i.name}: ${i.amount}`).join("\n");
      const prompt = `Du bist ein Küchenchef. Passe dieses Rezept von ${fromPersons} auf ${toPersons} ${toPersons===1?"Person":"Personen"} an.

Originalzutaten (für ${fromPersons} ${fromPersons===1?"Person":"Personen"}):
${ingredientList}

Originalzubereitung:
${recipe.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}

REGELN:
1. Skaliere alle Mengen korrekt und sinnvoll – nicht stupide multiplizieren.
   - Gewürze und Salz skalieren weniger stark (z.B. Salz × 1.5 statt × 3)
   - Garzeiten ändern sich oft kaum – weise darauf hin wenn sie sich ändern
   - Ganze Einheiten runden (z.B. 1.5 Eier → 2 Eier)
2. Passe die Zubereitungsschritte an wo nötig (z.B. größere Pfanne, längere Garzeit)
3. Behalte available-Status aller Zutaten unverändert

Antworte NUR mit JSON (kein Markdown):
{"ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const text = await callClaude(prompt, 800);
      const scaled = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g,"").trim());
      return res.status(200).json({ recipe: { ...recipe, ...scaled } });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
