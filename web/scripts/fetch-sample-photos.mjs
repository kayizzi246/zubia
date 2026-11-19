/*
  Downloads the sample listing photographs.

    node scripts/fetch-sample-photos.mjs

  WHY THIS EXISTS

  The sample listings used to show a blue SVG of a house, which made the
  whole site look like a wireframe. Stock photo sites are full of American
  suburbs, which would be worse than a placeholder: a Ugandan looking for a
  muzigo in Kawempe should not be shown a house in Ohio.

  So these come from Wikimedia Commons, which has photographs actually
  taken in Uganda under licences that permit reuse. Every one is recorded
  in public/sample/photos/CREDITS.md with its photographer, licence and
  source page, because most are CC BY-SA and that attribution is a
  condition of using them.

  WHAT IT DOES

  Fetches each file at about 1400px, then uses sharp to crop it to 3:2 and
  save a WebP at 1200x800. That strips all EXIF (including GPS, which can
  give away where someone lives) and gets each photo under ~120KB, which
  matters on a Ugandan mobile connection far more than pixel count does.

  Safe to re-run: it skips files already downloaded.
*/

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, "..", "public", "sample", "photos");

const WIDTH = 1200;
const HEIGHT = 800; // 3:2, the aspect ratio the listing cards use.

/**
 * The curated set, grouped by what kind of home each suits. Picked by hand
 * from Commons categories: free-text search returned conference photos and
 * a cemetery.
 *
 * Deliberately excluded: anything captioned as a slum. Those photographs
 * document real low-income housing, but attaching that label to somebody's
 * home in a rental advert is not something this site should do.
 */
export const PHOTOS = [
  // --- Single rooms and muzigo --------------------------------------------
  { slug: "muzigo-1", title: 'Uganda\'s "muzigo".jpg' },
  {
    slug: "single-room-1",
    title:
      "A Single Room rental on the outskirts of Lake Victoria, Wakiso District, Uganda.jpg",
  },
  { slug: "single-room-2", title: "Casual Labour residential.jpg" },
  { slug: "single-room-3", title: "House where the landlady lives (6901423309).jpg" },

  // --- Double rooms and bedsitters ----------------------------------------
  { slug: "room-1", title: "Home in wandegeya.jpg" },
  { slug: "room-2", title: "Facing home.jpg" },
  { slug: "room-3", title: "Home with beautiful environment.jpg" },
  { slug: "room-4", title: "Home & Habitat, Uganda.jpg" },

  // --- Flats and apartment blocks ------------------------------------------
  {
    slug: "apartment-1",
    title: "Apartment and office building with car park in Naguru, 2022.jpg",
  },
  { slug: "apartment-2", title: "Apartment in Entebbe Uganda.jpg" },
  { slug: "apartment-3", title: "Apartment block in kololo Kampala.jpg" },
  { slug: "apartment-4", title: "Komamboga, Kampala.jpg" },

  // --- Houses and bungalows -------------------------------------------------
  { slug: "house-1", title: "Gated home in Entebbe Uganda.jpg" },
  { slug: "house-2", title: "Affluent home in Uganda.jpg" },
  { slug: "house-3", title: "A rich man's home in Uganda.jpg" },
  { slug: "house-4", title: "A typical old Heritage design house with a potch.jpg" },
  { slug: "house-5", title: "Home Stead.jpg" },
  { slug: "house-6", title: "Good Looking Homeland.jpg" },
  { slug: "house-7", title: "My home my identity.jpg" },
  { slug: "house-8", title: "Fort Portal Home.jpg" },
  { slug: "house-9", title: "Home with a swing.jpg" },
  { slug: "house-10", title: "A house in the middle of a banana plantation.jpg" },

  // --- Boys' quarters --------------------------------------------------------
  {
    slug: "bq-1",
    title:
      "A Traditional design House, alongside its modern boys Quarters, Uganda.jpg",
  },

  // --- Land and plots --------------------------------------------------------
  { slug: "land-1", title: "An isolated homestead.jpg" },
  { slug: "land-2", title: "Drying bricks for construction of a house to promote wellness.jpg" },
  { slug: "land-3", title: "Construction of a new home.jpg" },
  {
    slug: "land-4",
    title: "Aerial view of a Home Setting in North Eastern Uganda.jpg",
  },

  // --- Neighbourhoods ---------------------------------------------------------
  { slug: "area-1", title: "Kiwatule Neighborhood.jpg" },
  { slug: "area-2", title: "Lower Naguru.jpg" },
  { slug: "area-3", title: "Kampala suburb.JPG" },
];

const stripHtml = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Commons answers 429 if you ask too fast, which is fair: this is a free
 * service. One request at a time, a pause between them, and a backoff on
 * 429 rather than hammering it.
 */
async function politeFetch(url, attempt = 1) {
  const response = await fetch(url, {
    headers: { "User-Agent": "zubia-sample-photos/1.0 (one-off demo data)" },
  });

  if (response.status === 429 && attempt <= 5) {
    const wait = Number(response.headers.get("retry-after")) * 1000 || attempt * 4000;
    console.log(`  rate limited, waiting ${Math.round(wait / 1000)}s…`);
    await sleep(wait);
    return politeFetch(url, attempt + 1);
  }

  return response;
}

/** Asks Commons for the download URL and the attribution details. */
async function lookup(title) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1400",
  }).toString();

  const response = await politeFetch(url);
  if (!response.ok) throw new Error(`lookup failed: ${response.status}`);

  const json = await response.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = (page?.imageinfo ?? [])[0];
  if (!info) throw new Error("not found on Commons");

  const meta = info.extmetadata ?? {};
  return {
    downloadUrl: info.thumburl ?? info.url,
    mime: info.mime,
    licence: stripHtml(meta.LicenseShortName?.value) || "see source",
    author: stripHtml(meta.Artist?.value) || "Unknown",
    pageUrl: info.descriptionurl,
  };
}

/** A real JPEG or PNG, not something pretending to be one. */
function looksLikeImage(buffer) {
  if (buffer.length < 8) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  return jpeg || png;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const credits = [];
  let downloaded = 0;
  let skipped = 0;
  const failures = [];

  for (const photo of PHOTOS) {
    // A pause between files, so Commons is not hammered.
    await sleep(1500);
    const outPath = path.join(OUT_DIR, `${photo.slug}.webp`);

    let already = false;
    try {
      await fs.access(outPath);
      already = true;
    } catch {
      already = false;
    }

    let details;
    try {
      details = await lookup(photo.title);
    } catch (error) {
      failures.push(`${photo.slug}: ${error.message}`);
      continue;
    }

    credits.push({ ...photo, ...details });

    if (already) {
      skipped += 1;
      continue;
    }

    try {
      const response = await politeFetch(details.downloadUrl);
      if (!response.ok) throw new Error(`download failed: ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!looksLikeImage(buffer)) {
        throw new Error("downloaded file is not a JPEG or PNG");
      }

      // sharp re-encodes from pixels, so nothing from the original file
      // survives into what we serve: no EXIF, no GPS, no embedded junk.
      await sharp(buffer)
        .rotate() // honour EXIF orientation before it is discarded
        .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
        .webp({ quality: 78 })
        .toFile(outPath);

      const { size } = await fs.stat(outPath);
      console.log(
        `${photo.slug.padEnd(16)} ${String(Math.round(size / 1024)).padStart(4)}KB  ${details.licence}`,
      );
      downloaded += 1;
    } catch (error) {
      failures.push(`${photo.slug}: ${error.message}`);
    }
  }

  // --- CREDITS.md ----------------------------------------------------------
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
    "| File | Photographer | Licence | Source |",
    "|---|---|---|---|",
  ];

  for (const credit of credits) {
    const author = credit.author.replace(/\|/g, "/").slice(0, 60);
    lines.push(
      `| \`${credit.slug}.webp\` | ${author} | ${credit.licence} | [${credit.title.replace(/\|/g, "/").slice(0, 50)}](${credit.pageUrl}) |`,
    );
  }

  lines.push("");
  await fs.writeFile(path.join(OUT_DIR, "CREDITS.md"), lines.join("\n"));

  console.log("");
  console.log(`${downloaded} downloaded, ${skipped} already present.`);
  console.log(`CREDITS.md written with ${credits.length} entries.`);
  if (failures.length > 0) {
    console.log("");
    console.log("Could not fetch:");
    for (const failure of failures) console.log(`  ${failure}`);
  }
}

// Only download when run directly. Importing this module (for the slug
// list) must not set off thirty HTTP requests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
