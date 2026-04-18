import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, ...params } = req.body;

  try {
    if (type === "scan") {
      const { base64, mimeType } = params;
      const message = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 } },
            { type: "text", text: 'Analysiere dieses Foto eines Kühlschranks oder einer Vorratskammer. Liste alle erkennbaren Lebensmittel und Zutaten auf. Sei dabei so PRÄZISE wie möglich: schreibe "Mozzarella" statt "Käse", "Frühlingszwiebeln" statt "Zwiebeln", "Kirschtomaten" statt "Tomaten" usw. Antworte NUR mit einem JSON-Array auf Deutsch, z.B.: ["Mozzarella","Frühlingszwiebeln","Hähnchenbrust"]. Kein Markdown, keine Erklärungen.' }
          ]
        }]
      });
      const text = message.content[0].text;
      const found = JSON.parse(text.replace(/```json|```/g, "").trim());
      return res.status(200).json({ ingredients: found });
    }

    if (type === "recipe") {
      const { ingredients, time, mood, portion, intolerances, disliked, nope } = params;

      const timeMap = {
        "Schnell": "maximal 15 Minuten",
        "Normal": "maximal 30 Minuten",
        "Gemütlich": "60 bis 90 Minuten"
      };
      const timeLimit = timeMap[time] || "maximal 30 Minuten";

      const cuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch"];
      const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];

      const ingList = ingredients?.length > 0 ? ingredients.join(", ") : "keine – wähle ein kreatives überraschendes Gericht";
      const intolHint = intolerances?.length > 0 ? `Unverträglichkeiten (strikt einhalten!): ${intolerances.join(", ")}` : "";
      const dislikeHint = disliked?.length > 0 ? `Heute unerwünscht (komplett weglassen!): ${disliked.join(", ")}` : "";

      // Different nope strategies
      let nopeHint = "";
      if (nope === "zu_aufwendig") {
        nopeHint = `WICHTIG: Das letzte Rezept war zu aufwendig. Wähle diesmal ein DEUTLICH einfacheres und schnelleres Gericht – weniger Zutaten, weniger Schritte, maximale ${timeLimit}.`;
      } else if (nope === "anderes_gericht") {
        nopeHint = `WICHTIG: Der Nutzer will etwas komplett anderes. Wähle eine VÖLLIG andere Küche als zuvor und einen anderen Stil. Sei mutig und überraschend.`;
      }

      const prompt = `Du bist ein kreativer Küchenchef.

Verfügbare Zutaten des Nutzers: ${ingList}
ZEITLIMIT (STRIKT EINHALTEN!): ${timeLimit}
Hunger: ${mood} | Personen: ${portion}
${intolHint}
${dislikeHint}
${nopeHint}

WICHTIGE REGELN:
1. ZEITLIMIT: Das Gericht muss in ${timeLimit} fertig sein. Kein Schmorbraten, keine langen Garzeiten.
2. ZUTATEN-STRATEGIE – wähle EINE der folgenden Varianten zufällig:
   - Variante A (60%): Nutze 2–3 vorhandene Zutaten als Basis. Das Gericht passt gut zum Vorrat.
   - Variante B (40%): Wähle ein kreatives Gericht das 1–2 frische Zutaten erfordert die NICHT im Vorrat sind (z.B. eine bestimmte Gemüsesorte, frische Kräuter). Diese kommen auf die Einkaufsliste. So entsteht Abwechslung über den Vorrat hinaus.
3. KRITISCH – "available" Feld: Setze "available: true" NUR für Zutaten die EXAKT in der Nutzerliste stehen. Alles andere bekommt "available: false" – auch wenn es günstig oder selbstverständlich erscheint.
4. Küche des Tages: ${cuisine}
5. Sei kreativ, kein 08/15-Gericht.
6. Alle Verbote und Unverträglichkeiten strikt einhalten.

Antworte NUR mit JSON (kein Markdown):
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-5",
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
