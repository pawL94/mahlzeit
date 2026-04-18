import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, ...params } = req.body;
  try {
    if (type === "scan") {
      const { base64, mimeType } = params;
      const message = await client.messages.create({
        model: "claude-sonnet-4-5", max_tokens: 400,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType||"image/jpeg", data: base64 } },
          { type: "text", text: 'Analysiere dieses Foto eines Kühlschranks oder einer Vorratskammer. Sei PRÄZISE: "Mozzarella" statt "Käse", "Frühlingszwiebeln" statt "Zwiebeln" usw. Antworte NUR mit JSON-Array auf Deutsch: ["Zutat1","Zutat2"]. Kein Markdown.' }
        ]}]
      });
      const found = JSON.parse(message.content[0].text.replace(/```json|```/g,"").trim());
      return res.status(200).json({ ingredients: found });
    }

    if (type === "recipe") {
      const { ingredients, time, mood, portion, intolerances, disliked, nope, lovedRecipes, avoidNames, weekMode } = params;
      const timeMap = { "Schnell":"maximal 15 Minuten", "Normal":"maximal 30 Minuten", "Gemütlich":"60 bis 90 Minuten" };
      const timeLimit = timeMap[time] || "maximal 30 Minuten";
      const cuisines = ["Italienisch","Asiatisch","Mexikanisch","Mediterran","Deutsch","Indisch","Amerikanisch","Französisch","Griechisch","Japanisch","Marokkanisch","Türkisch"];
      const cuisine = cuisines[Math.floor(Math.random()*cuisines.length)];
      const ingList = ingredients?.length>0 ? ingredients.join(", ") : "keine – wähle ein kreatives Gericht";
      const intolHint = intolerances?.length>0 ? `Unverträglichkeiten (strikt!): ${intolerances.join(", ")}` : "";
      const dislikeHint = disliked?.length>0 ? `Heute unerwünscht: ${disliked.join(", ")}` : "";

      // Nope strategies
      let nopeHint = "";
      if (nope==="zu_aufwendig") nopeHint = "WICHTIG: Das letzte Rezept war zu aufwendig. Wähle etwas DEUTLICH einfacheres – weniger Zutaten, weniger Schritte.";
      else if (nope==="anderes_gericht") nopeHint = "WICHTIG: Wähle eine VÖLLIG andere Küche und einen komplett anderen Stil als zuvor.";

      // Liked recipes → taste profile
      const lovedHint = lovedRecipes?.length>0
        ? `Der Nutzer liebt folgende Gerichte: ${lovedRecipes.join(", ")}. Nutze diese um seinen Geschmack zu verstehen, aber schlage KEIN dieser Gerichte nochmal vor. Schlage stattdessen ähnliche Küchen und Stile vor.`
        : "";

      // Week mode: avoid repeating dishes
      const avoidHint = avoidNames?.length>0
        ? `Bereits diese Woche geplant (nicht wiederholen): ${avoidNames.join(", ")}.`
        : "";

      const weekHint = weekMode ? "Dies ist Teil einer Wochenplanung. Wähle ein ausgewogenes, alltagstaugliches Abendessen." : "";

      const prompt = `Du bist ein kreativer Küchenchef.

Verfügbare Zutaten: ${ingList}
ZEITLIMIT (STRIKT!): ${timeLimit}
Hunger: ${mood} | Personen: ${portion}
${intolHint}
${dislikeHint}
${nopeHint}
${lovedHint}
${avoidHint}
${weekHint}

REGELN:
1. Zeitlimit ${timeLimit} NICHT überschreiten.
2. Zutaten-Strategie – wähle EINE:
   - Variante A (60%): 2–3 vorhandene Zutaten als Basis.
   - Variante B (40%): Kreatives Gericht mit 1–2 frischen Zutaten die zugekauft werden müssen (available: false).
3. "available: true" NUR für Zutaten die EXAKT in der Nutzerliste stehen. Im Zweifel false.
4. Küche des Tages: ${cuisine}
5. Kreativ, kein 08/15-Gericht. Alle Verbote strikt einhalten.

Antworte NUR mit JSON (kein Markdown):
{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","calories":"...","ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-5", max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      });
      const recipe = JSON.parse(message.content[0].text.replace(/```json|```/g,"").trim());
      return res.status(200).json({ recipe });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
