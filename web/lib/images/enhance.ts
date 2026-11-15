import "server-only";
import sharp from "sharp";
import { getImageEnhancer } from "@/lib/ai/image-providers";

export interface EnhancedPhoto {
  /** Final photo for the site: WebP, max 1920px, no hidden metadata. */
  data: Buffer;
  width: number;
  height: number;
  /** "basic" (free, always) or "ai:gemini" / "ai:openai". */
  method: string;
  /** Why AI wasn't used, if it was switched on but failed or was rejected. */
  aiNote?: string;
}

const MAX_SIDE = 1920;

/**
 * Free enhancement that runs on our own server, for every photo:
 * - turns phone photos the right way up (EXIF orientation)
 * - resizes to at most 1920px and saves as WebP (5-10x smaller, fast on 3G)
 * - gently stretches contrast, lifts colour and sharpens
 * - removes hidden metadata, including GPS location of where it was taken
 * It never adds or removes anything in the picture.
 */
async function basicEnhance(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .normalise({ lower: 1, upper: 99 })
    .modulate({ saturation: 1.06 })
    .sharpen({ sigma: 0.7 })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Width/height after applying EXIF rotation. */
async function orientedSize(input: Buffer) {
  const meta = await sharp(input).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  return { width: (swap ? meta.height : meta.width) ?? 0, height: (swap ? meta.width : meta.height) ?? 0 };
}

/**
 * Improves an uploaded listing photo. Always does the free basic pass; if an
 * AI provider is configured it tries that first, and falls back to basic if
 * the AI fails or returns a photo with a different shape (a sign it changed
 * the framing or invented content).
 */
export async function enhanceListingPhoto(input: Buffer): Promise<EnhancedPhoto> {
  const enhancer = getImageEnhancer();

  if (enhancer) {
    try {
      // Send the AI a right-way-up JPEG of sensible size (cheaper and faster).
      const prepared = await sharp(input)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 92 })
        .toBuffer();
      const original = await orientedSize(prepared);
      const aiOutput = await enhancer.enhance(prepared, "image/jpeg");
      const result = await orientedSize(aiOutput);

      const ratioIn = original.width / original.height;
      const ratioOut = result.width / result.height;
      if (!result.width || Math.abs(ratioOut - ratioIn) / ratioIn > 0.03) {
        throw new Error("the AI changed the photo's shape, so its result was not used");
      }

      // Still resize/compress/strip metadata, but skip the colour tweaks.
      const { data, info } = await sharp(aiOutput)
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height, method: `ai:${enhancer.name}` };
    } catch (error) {
      const aiNote = `AI enhancement skipped: ${(error as Error).message}`;
      console.warn(aiNote);
      return { ...(await basicEnhance(input)), method: "basic", aiNote };
    }
  }

  return { ...(await basicEnhance(input)), method: "basic" };
}
