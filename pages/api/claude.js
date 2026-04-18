import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, ...params } = req.body;

  try {
    if (type === "scan") {
      const { base64, mimeType } = params;
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 } },
            { type: "text", text: 'Analysiere dieses Foto (Kühlschrank oder Vorratskammer). Liste alle erkennbaren Lebensmittel auf Deutsch auf. Antworte NUR mit einem JSON-Array, z.B.: ["Eier","Milch","Käse"]. Kein Markdown, keine Erklärungen.' }
          ]
        }]
      });
      const text = message.content[0].text;
      const found = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ ingredients: found });
    }

    if (type === "recipe") {
      const { ingredients, time, mood, portion, intolerances, disliked, nope } = params;
      const timeMap = { "Schnell": "maximal 15 Minuten", "Normal": "maximal 30 Minuten", "Gemütlich": "60 bis 90 Minuten" };
      const timeLimit = timeMap[time] || "maximal 30 Minuten";
      const cuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch"];
      const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
      const ingList = ingredients?.length > 0 ? ingredients.join(", ") : "keine – wähle ein kreatives überraschendes Gericht";
      const nopeHint = nope ? `Letztes Rezept abgelehnt wegen: "${nope}". Wähle KOMPLETT andere Küche und Stil.` : "";
      const intolHint = intolerances?.length > 0 ? `Unverträglichkeiten (strikt einhalten!): ${intolerances.join(", ")}` : "";
      const dislikeHint = disliked?.length > 0 ? `Heute unerwünscht (komplett weglassen!): ${disliked.join(", ")}` : "";

      const prompt = `Du bist ein kreativer Küchenchef.

Verfügbare Zutaten: ${ingList}
ZEITLIMIT (STRIKT!): ${timeLimit} – kein Schmorbraten, keine langen Garzeiten!
Hunger: ${mood} | Personen: ${portion}
${intolHint}
${dislikeHint}
${nopeHint}

REGELN:
- Zeitlimit ${timeLimit} NICHT überschreiten
- Nutze nur 2–4 der verfügbaren Zutaten – nicht alle
- Küche des Tages: ${cuisine}
- Fehlende Zutaten sind ok (available: false)
- Kreativ und lecker, kein 08/15-Gericht
- Alle Verbote strikt einhalten

Antworte NUR mit JSON (kein Markdown):
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      });
      const text = message.content[0].text;
      const recipe = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ recipe });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
