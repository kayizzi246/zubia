import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/auth";
import { enhanceListingPhoto } from "@/lib/images/enhance";
import {
  isStorageConfigured,
  putPhoto,
  storageConfigProblem,
} from "@/lib/storage/r2";

// Upload one listing photo: keep the original, enhance a copy, store both in
// R2 (S3-compatible) and return their public URLs. One photo per request, so
// each photo shows its own progress and a slow AI call can't time out the rest.

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });
  if (!admin.can("listings.manage")) {
    return NextResponse.json(
      { error: "Your admin account cannot change listing photos." },
      { status: 403 },
    );
  }

  // Checked before reading the upload, so a misconfigured server says so
  // instead of accepting a 15 MB file and then failing.
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: storageConfigProblem() ?? "Photo storage is not set up." },
      { status: 503 },
    );
  }

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

  const id = randomUUID();
  const month = new Date().toISOString().slice(0, 7); // e.g. 2026-11
  // originals/ keeps the untouched upload so a photo can always be redone;
  // listings/ holds the enhanced copy the site shows.
  const originalKey = `originals/${month}/${id}.${TYPES[file.type]}`;
  const enhancedKey = `listings/${month}/${id}.webp`;

  let urls: [string, string];
  try {
    urls = await Promise.all([
      putPhoto(enhancedKey, enhanced.data, "image/webp"),
      putPhoto(originalKey, input, file.type),
    ]);
  } catch (error) {
    console.error("Photo upload failed:", error);
    return NextResponse.json(
      { error: "Couldn't save the photo. Check the R2 settings in web/.env.local." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: urls[0],
    originalUrl: urls[1],
    method: enhanced.method,
    aiNote: enhanced.aiNote,
    width: enhanced.width,
    height: enhanced.height,
    savedKB: Math.max(0, Math.round((input.length - enhanced.data.length) / 1024)),
  });
}
