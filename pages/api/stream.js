// Fix #1: SYSTEM_PROMPT from single shared source
// Fix #2: streaming via SDK generator instead of manual SSE parsing
// Fix #8: basic validation before SSE headers are sent
// Fix #14: rate limiting
import { getTrendingRecipes, buildRecipePrompt, streamRecipe } from "../../lib/anthropic";
import { rateLimit } from "../../lib/rateLimit";

export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Fix #14: rate limiting – must happen before SSE headers
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip)) return res.status(429).json({ error: "Too many requests – bitte warte kurz." });

  // Fix #8: validate before committing to SSE (while we can still send HTTP errors)
  const params = req.body ?? {};
  if (!params.mood || typeof params.mood !== "string") {
    return res.status(400).json({ error: "mood required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const trending = await getTrendingRecipes(params.mood);
    const { prompt } = await buildRecipePrompt(params, trending);

    // Fix #2: iterate the SDK generator – no manual buffer/split/parse needed
    for await (const text of streamRecipe(prompt)) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (err) {
    console.error("[stream]", err.message);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
