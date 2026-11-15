import "server-only";
import { GoogleGenAI } from "@google/genai";

// AI photo enhancement providers. Choose one in web/.env.local:
//   AI_IMAGE_PROVIDER=none     (default: free, no AI, basic enhancement only)
//   AI_IMAGE_PROVIDER=gemini   (needs GEMINI_API_KEY; paid per photo)
//   AI_IMAGE_PROVIDER=openai   (needs OPENAI_API_KEY; paid per photo)
// Every provider gets the same prompt and the same safety checks, so switching
// from Gemini to ChatGPT later is a one-line change in .env.local.

export interface ImageEnhancer {
  /** Short name saved with each photo, e.g. "gemini". */
  name: string;
  enhance(image: Buffer, mimeType: string): Promise<Buffer>;
}

/**
 * Property photos must stay truthful: buyers decide based on them. The prompt
 * only allows photographic fixes and forbids changing the property itself.
 */
export const ENHANCE_PROMPT = [
  "Improve the photographic quality of this real estate photo.",
  "Correct exposure and white balance, recover detail in shadows and highlights,",
  "reduce noise and blur, and make colours natural and true to life.",
  "This photo is used to sell or rent a real property, so it must stay truthful:",
  "do NOT add, remove, move or replace anything. No new furniture, plants, sky, people or objects.",
  "Do not hide damage, cracks, stains, wires or clutter. Do not change walls, floors, the view or room sizes.",
  "Keep exactly the same framing, perspective and aspect ratio. Return only the improved photo.",
].join(" ");

// TODO(ai): Gemini image models have no free API tier (checked Nov 2026,
// ~US$0.034 per photo for gemini-3.1-flash-lite-image). Check
// https://aistudio.google.com/docs/pricing before switching this on.
function geminiEnhancer(apiKey: string): ImageEnhancer {
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-lite-image";

  return {
    name: "gemini",
    async enhance(image, mimeType) {
      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: "text", text: ENHANCE_PROMPT },
          { type: "image", mime_type: mimeType, data: image.toString("base64") },
        ],
      });
      const data = interaction.output_image?.data;
      if (!data) throw new Error("Gemini returned no image");
      return Buffer.from(data, "base64");
    },
  };
}

// TODO(ai): untested until an OpenAI key is added. Uses the Images "edits"
// endpoint; set OPENAI_IMAGE_MODEL if OpenAI renames its image model.
function openaiEnhancer(apiKey: string): ImageEnhancer {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  return {
    name: "openai",
    async enhance(image, mimeType) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", ENHANCE_PROMPT);
      form.append("image", new Blob([new Uint8Array(image)], { type: mimeType }), "photo");
      form.append("size", "auto");

      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!res.ok) throw new Error(`OpenAI image edit failed (${res.status}): ${await res.text()}`);
      const json = (await res.json()) as { data?: { b64_json?: string }[] };
      const data = json.data?.[0]?.b64_json;
      if (!data) throw new Error("OpenAI returned no image");
      return Buffer.from(data, "base64");
    },
  };
}

/** The configured AI enhancer, or null when AI is off or not set up. */
export function getImageEnhancer(): ImageEnhancer | null {
  const provider = (process.env.AI_IMAGE_PROVIDER || "none").toLowerCase();
  if (provider === "gemini" && process.env.GEMINI_API_KEY) return geminiEnhancer(process.env.GEMINI_API_KEY);
  if (provider === "openai" && process.env.OPENAI_API_KEY) return openaiEnhancer(process.env.OPENAI_API_KEY);
  if (provider !== "none") {
    console.warn(`AI_IMAGE_PROVIDER=${provider} but its API key is missing; using basic enhancement only.`);
  }
  return null;
}
