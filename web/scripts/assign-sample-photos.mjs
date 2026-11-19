/*
  Points the sample listings at the real photographs.

    node scripts/fetch-sample-photos.mjs    # first: download them
    node scripts/assign-sample-photos.mjs   # then: wire them in

  A one-off edit to lib/sample-listings.ts, kept in the repo so the
  assignment is reproducible rather than 52 hand-edits nobody can check.

  It reads whatever is actually in public/sample/photos, so a photo that
  failed to download can never end up referenced by a listing.

  Each listing gets photos matching what it is: a single room gets a
  muzigo, a 2-bedroom flat gets an apartment block, a plot gets land. The
  choice is deterministic (by position within its group), so re-running
  changes nothing and the diff stays readable.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(HERE, "..", "public", "sample", "photos");
const SOURCE = path.join(HERE, "..", "lib", "sample-listings.ts");

/** The slugs that actually downloaded, bucketed by what they show. */
function loadPools() {
  const slugs = fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => f.endsWith(".webp"))
    .map((f) => f.replace(/\.webp$/, ""))
    .sort();

  const by = (prefix) => slugs.filter((s) => s.startsWith(prefix));

  const small = [...by("muzigo"), ...by("single-room")];
  const mid = by("room");
  const flat = by("apartment");
  const house = by("house");
  const bq = by("bq");
  const land = by("land");
  const area = by("area");

  // Falling back keeps every listing with a photo even if a group came back
  // empty, rather than leaving a blank card.
  const or = (first, ...rest) =>
    first.length > 0 ? first : rest.find((p) => p.length > 0) ?? slugs;

  return {
    small: or(small, mid, flat),
    mid: or(mid, small, flat),
    flat: or(flat, mid, house),
    house: or(house, flat),
    bq: or(bq, house, mid),
    land: or(land, area, house),
    area: or(area, house),
    all: slugs,
  };
}

/** Which pool a listing draws from. */
function poolFor(listing, pools) {
  if (listing.type === "land") return pools.land;

  switch (listing.unitType) {
    case "single_room":
    case "hostel":
      return pools.small;
    case "double_room":
    case "bedsitter":
      return pools.mid;
    case "bq":
      return pools.bq;
    case "one_bedroom":
    case "two_bedroom":
      return pools.flat;
    case "three_bedroom":
    case "house":
      return pools.house;
    default:
      break;
  }

  // Sale listings, and the one commercial rental, have no unit type.
  return listing.type === "buy" ? pools.house : pools.flat;
}

/**
 * Pulls id, type and unitType out of the source without running it, so this
 * script does not need the Next.js module graph.
 */
function parseListings(source) {
  const listings = [];
  const idRe = /id:\s*"([^"]+)"/g;
  let match;

  while ((match = idRe.exec(source)) !== null) {
    const start = match.index;
    const next = source.indexOf('id: "', start + 5);
    const block = source.slice(start, next === -1 ? source.length : next);

    listings.push({
      id: match[1],
      start,
      type: /type:\s*"(buy|rent|land)"/.exec(block)?.[1] ?? "rent",
      unitType: /unitType:\s*"(\w+)"/.exec(block)?.[1] ?? null,
      photosMatch: /photos:\s*\[[^\]]*\]/.exec(block),
    });
  }

  return listings;
}

function main() {
  if (!fs.existsSync(PHOTO_DIR)) {
    console.error(
      "No photos yet. Run: node scripts/fetch-sample-photos.mjs",
    );
    process.exit(1);
  }

  const pools = loadPools();
  if (pools.all.length === 0) {
    console.error("public/sample/photos has no .webp files.");
    process.exit(1);
  }

  let source = fs.readFileSync(SOURCE, "utf8");
  const listings = parseListings(source);

  // Counters per pool, so consecutive listings of the same kind get
  // different photographs instead of the same one over and over.
  const taken = new Map();

  // Rewritten back to front, so earlier offsets stay valid.
  const edits = [];

  for (const listing of listings) {
    if (!listing.photosMatch) continue;

    const pool = poolFor(listing, pools);
    const key = pool.join("|");
    const index = taken.get(key) ?? 0;
    taken.set(key, index + 1);

    // Two or three photos each, so the card carousel has something to do.
    const count = Math.min(pool.length, 2 + (index % 2));
    const chosen = Array.from(
      { length: count },
      (_, i) => pool[(index + i) % pool.length],
    );

    const replacement = `photos: [${chosen
      .map((slug) => `P("${slug}")`)
      .join(", ")}]`;

    edits.push({
      from: listing.start + listing.photosMatch.index,
      to: listing.start + listing.photosMatch.index + listing.photosMatch[0].length,
      replacement,
    });
  }

  for (const edit of edits.sort((a, b) => b.from - a.from)) {
    source = source.slice(0, edit.from) + edit.replacement + source.slice(edit.to);
  }

  // Swap the old SVG placeholder constants for the photo helper.
  source = source.replace(
    /const HOUSE = "\/sample\/house\.svg";\nconst APARTMENT = "\/sample\/apartment\.svg";\nconst LAND = "\/sample\/land\.svg";/,
    `/**
 * Real photographs of Ugandan houses, not the blue placeholder drawings
 * this file used to point at. They are NOT photos of these invented
 * listings: see public/sample/photos/CREDITS.md for the photographers and
 * licences, and replace them with real listing photos before launch.
 */
const P = (slug: string) => \`/sample/photos/\${slug}.webp\`;`,
  );

  fs.writeFileSync(SOURCE, source);

  console.log(`Assigned photos to ${edits.length} listings.`);
  for (const [name, pool] of Object.entries(pools)) {
    if (name === "all") continue;
    console.log(`  ${name.padEnd(6)} ${pool.length} photo(s)`);
  }
}

main();
