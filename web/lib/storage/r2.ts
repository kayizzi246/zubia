import "server-only";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/*
  Listing photo storage, replacing Supabase Storage.

  Cloudflare R2 is used through the S3 API, so this file works unchanged
  against R2, MinIO, Backblaze B2, AWS S3 or anything else that speaks S3.
  Only the four environment variables change.

  Photos are served from R2's public bucket URL (or a custom domain), not
  proxied through Next.js, so the images come off Cloudflare's CDN. That
  matters a lot on a Ugandan mobile connection, where the round trip to a
  European origin is the slow part.
*/

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
export const R2_BUCKET = process.env.R2_BUCKET ?? "listing-photos";

/**
 * Where the browser fetches photos from: the bucket's public r2.dev address
 * or, better, a custom domain. Without it, uploaded photos cannot be shown.
 */
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

/** S3-compatible endpoint. R2 derives it from the account id. */
const ENDPOINT =
  process.env.R2_ENDPOINT?.replace(/\/$/, "") ||
  (ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

export function isStorageConfigured(): boolean {
  return Boolean(ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY && PUBLIC_BASE);
}

/** A sentence naming what is missing, for the admin to act on. */
export function storageConfigProblem(): string | null {
  const missing: string[] = [];
  if (!ENDPOINT) missing.push("R2_ACCOUNT_ID (or R2_ENDPOINT)");
  if (!ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!PUBLIC_BASE) missing.push("R2_PUBLIC_BASE_URL");
  if (missing.length === 0) return null;
  return `Photo storage is not set up. Add ${missing.join(", ")} to web/.env.local.`;
}

const globalForR2 = globalThis as unknown as { zubiaR2?: S3Client };

function client(): S3Client {
  if (!globalForR2.zubiaR2) {
    globalForR2.zubiaR2 = new S3Client({
      // R2 ignores the region but the SDK insists on one.
      region: process.env.R2_REGION ?? "auto",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  }
  return globalForR2.zubiaR2;
}

/**
 * Stores one object and returns the URL to show it at.
 *
 * Photos are immutable: a new upload gets a new key, so they are cached for
 * a year and never need revalidating.
 */
export async function putPhoto(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrl(key);
}

export function publicUrl(key: string): string {
  return `${PUBLIC_BASE}/${key}`;
}

/**
 * The storage key a stored photo URL points at, or null if the URL is
 * not ours.
 *
 * Listings keep whole URLs, not keys, and some of those URLs are the
 * local sample photos or old Supabase links. Deriving the key here means
 * a delete can never be aimed at an object that was not uploaded to this
 * bucket.
 */
export function keyFromUrl(url: string): string | null {
  if (!PUBLIC_BASE || !url.startsWith(`${PUBLIC_BASE}/`)) return null;
  const key = url.slice(PUBLIC_BASE.length + 1).split("?")[0];
  return key || null;
}

/**
 * Removes photos from the bucket. Best effort, by design.
 *
 * The listing row is already gone by the time this runs, so a storage
 * failure must not surface as a failed delete: that would tell an admin
 * the listing is still there when it is not. A leftover object costs a
 * fraction of a cent; a confusing error costs more.
 *
 * Returns how many keys were requested, for the caller to log.
 */
export async function deletePhotos(urls: string[]): Promise<number> {
  if (!isStorageConfigured()) return 0;

  const keys = [...new Set(urls.map(keyFromUrl).filter((k): k is string => !!k))];
  if (keys.length === 0) return 0;

  // DeleteObjects takes at most 1000 keys per call.
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    try {
      await client().send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    } catch (error) {
      console.error(
        "Could not delete listing photos from storage:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return keys.length;
}
