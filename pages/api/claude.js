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
        'Analysiere dieses Foto eines Kühlschranks. Sei PRÄZISE: "Mozzarella" statt "Käse", "Frühlingszwiebeln" statt "Zwiebeln". Antworte NUR mit JSON-Array auf Deutsch: ["Zutat1","Zutat2"]. Kein Markdown.',
        base64, mimeType
      );
      const found = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ ingredients: found });
    }

    // ── Recipe ────────────────────────────────────────────
    if (type === "recipe") {
      const { ingredients, time, mood, portion, intolerances, disliked, nope, lovedRecipes, avoidNames, avoidName, weekMode } = params;

      const timeMap = { "Schnell": "maximal 15 Minuten", "Normal": "maximal 30 Minuten", "Gemütlich": "60 bis 90 Minuten" };
      const timeLimit = timeMap[time] || "maximal 30 Minuten";

      const allCuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch","Spanisch","Koreanisch","Vietnamesisch","Libanesisch"];
      const cuisine = allCuisines[Math.floor(Math.random() * allCuisines.length)];
      const reqId = Math.random().toString(36).substring(7);

      const ingList = ingredients?.length > 0 ? ingredients.join(", ") : "keine – wähle ein kreatives Gericht";

      const intoleranceMap = {
        "Laktosefrei": "Laktose: laktosefreie Alternativen ODER Gerichte ohne Milchprodukte.",
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

      const lines = [];
      if (intolerances?.length > 0) lines.push("UNVERTRÄGLICHKEITEN: " + intolerances.map(i => intoleranceMap[i] || "Vermeiden: " + i).join(" | "));
      if (disliked?.length > 0) lines.push("Heute nicht gewünscht: " + disliked.join(", "));
      if (avoidName) lines.push(`"${avoidName}" wurde abgelehnt – schlage etwas KOMPLETT anderes vor!`);
      if (avoidNames?.length > 0) lines.push("Diese Woche nicht wiederholen: " + avoidNames.join(", "));
      if (nope === "zu_aufwendig") lines.push("Zu aufwendig → DEUTLICH einfacheres Gericht, weniger Zutaten/Schritte.");
      if (nope === "anderes_gericht") lines.push("Falscher Stil → VÖLLIG andere Küche. Heute unbedingt: " + cuisine);
      if (lovedRecipes?.length > 0) lines.push("Lieblingsgerichte (nicht wiederholen, aber Stil nutzen): " + lovedRecipes.join(", "));
      if (weekMode) lines.push("Wochenplanung: ausgewogenes Abendessen.");

      const prompt = `Du bist ein kreativer Küchenchef. [${reqId}]

Zutaten: ${ingList}
ZEITLIMIT: ${timeLimit} – strikt einhalten!
Stimmung: ${mood} | Personen: ${portion}
${lines.join("\n")}

REGELN:
1. Zeitlimit ${timeLimit} NICHT überschreiten.
2. Nutze 2-3 vorhandene Zutaten ODER (40% der Fälle) wähle ein Gericht mit 1-2 frischen Zutaten die zugekauft werden müssen.
3. available:true NUR wenn Zutat EXAKT in der Zutaten-Liste steht.
4. Küche: ${nope === "anderes_gericht" ? cuisine + " – PFLICHT!" : cuisine}
5. Kreativ, keine Standardgerichte.

Antworte NUR mit JSON (kein Markdown):
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const text = await callClaude(prompt);
      const recipe = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ recipe });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
