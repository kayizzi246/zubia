/*
  Rebuilds public/sample/photos/CREDITS.md from the photos actually on disk.

    node scripts/write-photo-credits.mjs

  Separate from fetch-sample-photos.mjs because Commons rate-limits hard,
  and an interrupted download leaves the credits covering only part of what
  was fetched. Most of these photographs are CC BY-SA, where crediting the
  photographer is a condition of use, so this file has to match the images
  exactly.

  Results are cached in scripts/.photo-credits-cache.json, so re-running
  after the first time needs no network at all.
*/

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHOTOS } from "./fetch-sample-photos.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(HERE, "..", "public", "sample", "photos");
const CACHE = path.join(HERE, ".photo-credits-cache.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stripHtml = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function politeFetch(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { "User-Agent": "zubia-sample-photos/1.0 (credits)" },
  });
  if (response.status === 429 && attempt <= 6) {
    const wait =
      Number(response.headers.get("retry-after")) * 1000 || attempt * 15000;
    console.log(`  rate limited, waiting ${Math.round(wait / 1000)}s…`);
    await sleep(wait);
    return politeFetch(url, attempt + 1);
  }
  return response;
}

async function lookup(title) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
  }).toString();

  const response = await politeFetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json = await response.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = (page?.imageinfo ?? [])[0];
  if (!info) throw new Error("not found on Commons");

  const meta = info.extmetadata ?? {};
  return {
    licence: stripHtml(meta.LicenseShortName?.value) || "see source",
    author: stripHtml(meta.Artist?.value) || "Unknown",
    pageUrl: info.descriptionurl,
  };
}

async function loadCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Attribution gathered while choosing the photos, keyed by Commons file
 * title. Having it checked in means the credits can be rebuilt with no
 * network at all, which matters because Commons rate-limits aggressively.
 */
async function loadSeed() {
  try {
    return JSON.parse(
      await fs.readFile(path.join(HERE, ".commons-meta-seed.json"), "utf8"),
    );
  } catch {
    return {};
  }
}

async function main() {
  const onDisk = new Set(
    (await fs.readdir(PHOTO_DIR))
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(/\.webp$/, "")),
  );

  const wanted = PHOTOS.filter((p) => onDisk.has(p.slug));
  console.log(`${wanted.length} of ${onDisk.size} files have a known source.`);

  const cache = await loadCache();
  const seed = await loadSeed();
  const rows = [];
  const failures = [];
  let fetched = 0;

  for (const photo of wanted) {
    if (cache[photo.slug]) {
      rows.push({ ...photo, ...cache[photo.slug] });
      continue;
    }

    if (seed[photo.title]) {
      cache[photo.slug] = seed[photo.title];
      rows.push({ ...photo, ...seed[photo.title] });
      continue;
    }

    try {
      const details = await lookup(photo.title);
      cache[photo.slug] = details;
      rows.push({ ...photo, ...details });
      fetched += 1;
      console.log(`  ${photo.slug.padEnd(16)} ${details.licence}`);
      // Written as we go, so a rate-limit stop does not lose what we have.
      await fs.writeFile(CACHE, JSON.stringify(cache, null, 2));
      await sleep(1200);
    } catch (error) {
      failures.push(`${photo.slug}: ${error.message}`);
    }
  }

  const lines = [
    "# Sample photo credits",
    "",
    "These photographs are **not** of the sample listings they illustrate.",
    "The listings are invented; the photographs are real houses in Uganda,",
    "used so the site looks like what it is rather than a wireframe.",
    "",
    "They come from [Wikimedia Commons](https://commons.wikimedia.org).",
    "Most are licensed **CC BY-SA**, which requires that the photographer is",
    "credited and that derivative works carry the same licence. That is why",
    "this file exists, and why it must stay with the images.",
    "",
    "Each has been cropped to 3:2 and re-encoded as WebP, which also strips",
    "all EXIF data including GPS coordinates.",
    "",
    "**Replace these with real listing photos before launch.** They are here",
    "to fill a demo, not to represent anybody's property for rent.",
    "",
    "Regenerate with `node scripts/write-photo-credits.mjs`.",
    "",
    "| File | Photographer | Licence | Source |",
    "|---|---|---|---|",
  ];

  for (const row of rows.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const author = (row.author ?? "Unknown").replace(/\|/g, "/").slice(0, 55);
    const title = row.title.replace(/\|/g, "/").slice(0, 50);
    lines.push(
      `| \`${row.slug}.webp\` | ${author} | ${row.licence} | [${title}](${row.pageUrl}) |`,
    );
  }
  lines.push("");

  await fs.writeFile(path.join(PHOTO_DIR, "CREDITS.md"), lines.join("\n"));

  console.log("");
  console.log(
    `CREDITS.md written with ${rows.length} entries (${fetched} newly looked up).`,
  );
  if (failures.length > 0) {
    console.log("Could not look up (re-run to retry):");
    for (const f of failures) console.log(`  ${f}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
