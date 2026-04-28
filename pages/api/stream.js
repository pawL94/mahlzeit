import { buildRecipePrompt, getTrendingRecipes } from "./claude.js";

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const params = req.body;
  const trending = await getTrendingRecipes();
  const { prompt } = await buildRecipePrompt(params, trending);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      let errMsg = "API error " + response.status;
      try { const err = await response.json(); errMsg = err.error?.message || errMsg; } catch(e) {}
      console.error("Anthropic API error:", errMsg);
      res.write(`event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
          }
        } catch(e) {}
      }
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
