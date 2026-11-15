import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/auth";
import { enhanceListingPhoto } from "@/lib/images/enhance";
import { createClient } from "@/lib/supabase/server";

// Upload one listing photo: keep the original, enhance a copy, store both in
// Supabase Storage and return their public URLs. One photo per request, so
// each photo shows its own progress and a slow AI call can't time out the rest.

const BUCKET = "listing-photos";
const MAX_BYTES = 15 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo was sent." }, { status: 400 });
  if (!TYPES[file.type]) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is over 15 MB." }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());

  let enhanced;
  try {
    enhanced = await enhanceListingPhoto(input);
  } catch {
    return NextResponse.json({ error: "That file doesn't look like a valid photo." }, { status: 422 });
  }

  const supabase = await createClient();
  const id = randomUUID();
  const month = new Date().toISOString().slice(0, 7); // e.g. 2026-11
  const originalPath = `originals/${month}/${id}.${TYPES[file.type]}`;
  const enhancedPath = `listings/${month}/${id}.webp`;

  const [orig, enh] = await Promise.all([
    supabase.storage.from(BUCKET).upload(originalPath, input, { contentType: file.type, cacheControl: "31536000" }),
    supabase.storage.from(BUCKET).upload(enhancedPath, enhanced.data, { contentType: "image/webp", cacheControl: "31536000" }),
  ]);
  const uploadError = orig.error ?? enh.error;
  if (uploadError) {
    console.error("Photo upload failed:", uploadError.message);
    return NextResponse.json(
      { error: "Couldn't save the photo. Has supabase/migrations/0003_photo_storage.sql been run?" },
      { status: 500 },
    );
  }

  const publicUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  return NextResponse.json({
    url: publicUrl(enhancedPath),
    originalUrl: publicUrl(originalPath),
    method: enhanced.method,
    aiNote: enhanced.aiNote,
    width: enhanced.width,
    height: enhanced.height,
    savedKB: Math.max(0, Math.round((input.length - enhanced.data.length) / 1024)),
  });
}
