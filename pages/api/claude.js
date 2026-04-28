import { callClaude, callClaudeWithImage, getTrendingRecipes, buildRecipePrompt, parseJSON, SYSTEM_PROMPT } from "../../lib/anthropic";
import { rateLimit } from "../../lib/rateLimit";

export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip)) return res.status(429).json({ error: "Too many requests – bitte warte kurz." });

  const { type, ...params } = req.body ?? {};
  if (!type || typeof type !== "string") return res.status(400).json({ error: "type required" });

  try {
    // ── Scan ─────────────────────────────────────────────────────────────────
    if (type === "scan") {
      const { base64, mimeType } = params;
      if (!base64 || typeof base64 !== "string") return res.status(400).json({ error: "base64 required" });

      // Improved scan prompt from remote (more systematic, reads labels actively)
      const scanPrompt = `Analysiere dieses Foto systematisch und erkenne alle sichtbaren Lebensmittel und Zutaten.

VORGEHEN - scanne das Bild Reihe für Reihe:
1. Oberes Regal / Kühlschrankdecke
2. Mittleres Regal
3. Unteres Regal / Gemüsefach
4. Türfächer (falls sichtbar)

FÜR JEDES PRODUKT:
- Lies Etiketten und Beschriftungen aktiv – auch kleine oder teilweise sichtbare Texte
- Erkenne Form, Farbe und Verpackungstyp als Hinweis wenn Text unleserlich
- Bei teilweise verdeckten Produkten: erkenne was du siehst

BENENNUNGSREGELN:
- Spezifisch: "Mozzarella" nicht "Käse", "Feta" nicht "Käse", "Hafermilch" nicht "Milch"
- Wenn Etikett unleserlich aber Produkt erkennbar: Kategorie nennen ("Joghurt", "Käse", "Aufschnitt")
- KEINE Markennamen (nicht "Alnatura", "Knorr", "Milka") – nur das Produkt selbst
- KEINE Nicht-Lebensmittel (Getränke ohne Nährwert, Putzmittel etc.)
- Keine Halluzinationen: wenn wirklich nicht erkennbar, weglassen

Antworte NUR mit JSON-Array auf Deutsch, so spezifisch wie möglich:
["Mozzarella","Karotten","Hafermilch","Cheddar","Hähnchenbrust","Eier"]`;

      const text = await callClaudeWithImage(scanPrompt, base64, mimeType || "image/jpeg");
      const found = parseJSON(text);
      return res.status(200).json({ ingredients: Array.isArray(found) ? found : [] });
    }

    // ── Recipe (non-streaming) ────────────────────────────────────────────────
    if (type === "recipe") {
      if (!params.mood || typeof params.mood !== "string") return res.status(400).json({ error: "mood required" });

      const trending = await getTrendingRecipes(params.mood);
      const { prompt } = await buildRecipePrompt(params, trending);
      const text = await callClaude(SYSTEM_PROMPT, prompt, 1200);
      const recipe = parseJSON(text);
      return res.status(200).json({ recipe });
    }

    // ── Combine shopping list ─────────────────────────────────────────────────
    if (type === "combine-shopping") {
      const { items } = params;
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "items array required" });

      const itemList = items.map(i => `- ${i.name}: ${i.amount} (${i.day})`).join("\n");
      const prompt = `Erstelle eine kombinierte Einkaufsliste aus diesen Wochenplan-Zutaten:\n\n${itemList}\n\nREGELN:\n1. Gleiche Zutat + gleiche Einheit → addieren (200g + 300g = 500g)\n2. Verschiedene Einheiten umrechnen: 1 EL = 15ml = 3 TL, ab 1000g → kg\n3. "nach Bedarf" nur einmal\n4. Sortieren: Gemüse & Obst / Fleisch & Fisch / Milchprodukte & Eier / Trockenwaren & Gewürze / Sonstiges\n\nNur JSON:\n{"categories":[{"name":"Gemüse & Obst","items":[{"name":"Tomate","amount":"5 Stück"}]}]}`;
      const text = await callClaude(SYSTEM_PROMPT, prompt, 800);
      const result = parseJSON(text);
      return res.status(200).json(result);
    }

    // ── Scale recipe ──────────────────────────────────────────────────────────
    if (type === "scale") {
      const { recipe, fromPersons, toPersons } = params;
      if (!recipe || typeof fromPersons !== "number" || typeof toPersons !== "number") {
        return res.status(400).json({ error: "recipe, fromPersons (number), toPersons (number) required" });
      }

      const ingList = recipe.ingredients.map(i => `- ${i.name}: ${i.amount}`).join("\n");
      const stepsText = recipe.steps.map((s,i) => `${i+1}. ${s}`).join("\n");
      const prompt = `Passe dieses Rezept von ${fromPersons} auf ${toPersons} ${toPersons===1?"Person":"Personen"} an.\n\nZutaten (für ${fromPersons} ${fromPersons===1?"Person":"Personen"}):\n${ingList}\n\nZubereitung:\n${stepsText}\n\nREGELN:\n1. Mengen sinnvoll skalieren – nicht stupide multiplizieren\n2. Gewürze/Salz skalieren schwächer (×1.5 statt ×3)\n3. Garzeiten ändern sich kaum – erwähne Ausnahmen\n4. Ganze Einheiten runden (1.5 Eier → 2 Eier)\n5. available-Status unverändert beibehalten\n\nNur JSON:\n{"ingredients":[{"name":"...","amount":"...","available":true}],"steps":["..."],"tip":"..."}`;
      const text = await callClaude(SYSTEM_PROMPT, prompt, 900);
      const scaled = parseJSON(text);
      return res.status(200).json({ recipe: { ...recipe, ...scaled } });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error("[claude]", err);
    return res.status(500).json({ error: err.message });
  }
}
