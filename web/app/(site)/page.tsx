import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { getPublicListings } from "@/lib/data/listings";
import type { Listing, ListingType } from "@/lib/types";

/*
  The home page is deliberately plain: white throughout, one accent
  colour, and whitespace rather than fills or rules to separate the
  sections. Anything decorative that was here before - the photographic
  hero, the coloured bands, the oversized counts - has been taken out.
*/


/*
  One colour each, at full strength: the card is the colour, with white
  type on it and a white button. Primary green, clay and ink - three
  depths rather than three hues, so the row reads as one family. White
  clears 4.5:1 on all three (6.47, 5.98 and 15.45).
*/
const TILES = [
  {
    title: "Buy a home",
    body: "Houses and apartments for sale, with the tenure and title status on every listing.",
    cta: "Browse homes",
    href: "/search?type=buy",
    icon: "M4 11 12 4l8 7v9H4z M10 20v-5h4v5",
    card: "bg-primary",
    button: "bg-white text-primary hover:bg-primary-tint",
  },
  {
    title: "Rent a home",
    body: "Apartments and houses to rent, from self-contained units to family homes.",
    cta: "Find rentals",
    href: "/search?type=rent",
    icon: "M5 20V6h14v14 M9 10h2 M13 10h2 M9 14h2 M13 14h2",
    card: "bg-clay",
    button: "bg-white text-clay hover:bg-clay-tint",
  },
  {
    title: "Sell or list",
    body: "Owners pay per listing. Agents and developers get a monthly plan with a verified badge.",
    cta: "See plans",
    href: "/pricing",
    icon: "M4 20h16 M6 20V9l6-5 6 5v11 M12 9v6 M9 12h6",
    card: "bg-ink",
    button: "bg-white text-ink hover:bg-surface",
  },
];

/**
 * How many cards a rail holds.
 *
 * Twelve is three or four pages on a desktop screen. Past that nobody
 * scrolls, and every extra card is another photo the browser downloads on
 * a connection that is paying for it by the megabyte.
 */
const RAIL_SIZE = 12;

/**
 * The recommended rail: what to put in front of someone who has just
 * arrived and has not told us anything about themselves yet.
 *
 * No personal data exists on a first visit, so "recommended" here means
 * the best honest guess: the hand-picked listings first, then a rotation
 * through rentals, homes and land so the rail shows that the site covers
 * all three rather than burying two of them below the fold.
 *
 * TODO: once saved listings and searches are stored per account, weight
 * this by what the person has actually looked at.
 */
function recommend(all: Listing[]): Listing[] {
  const picked = all.filter((l) => l.featured).slice(0, 4);

  const pools: Record<ListingType, Listing[]> = {
    rent: all.filter((l) => l.type === "rent" && !l.featured),
    buy: all.filter((l) => l.type === "buy" && !l.featured),
    land: all.filter((l) => l.type === "land" && !l.featured),
  };

  const order: ListingType[] = ["rent", "buy", "land"];
  let turn = 0;
  while (picked.length < RAIL_SIZE && order.some((t) => pools[t].length > 0)) {
    const next = pools[order[turn % order.length]].shift();
    if (next) picked.push(next);
    turn += 1;
  }

  return picked;
}

/** Title, a reason to care, and nothing else unless it earns its place. */
function SectionHead({
  title,
  accent,
  blurb,
  action,
}: {
  title: string;
  /** Second clause, set in the primary green. */
  accent?: string;
  /** One line saying why these listings and not others. */
  blurb?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6">
      <div>
        <h2 className="font-display text-[24px] font-black leading-[1.15] text-ink md:text-[28px]">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h2>
        {blurb && (
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-subtle">
            {blurb}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="hidden shrink-0 items-center gap-1 text-[15px] font-semibold text-primary hover:underline sm:flex"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const listings = await getPublicListings();

  const recommended = recommend(listings);

  /*
    A listing may only appear once on the page: two cards with the same
    id would mean two elements carrying the same anchor id, and
    #listing-x would stop working.
  */
  const alreadyShown = new Set(recommended.map((l) => l.id));

  /*
    The second rail is priced, not categorised. Rent is the decision most
    people arrive here to make, and the number at the top of the card is
    what they decide on, so the cheapest rentals go first.
  */
  const affordable = listings
    .filter((l) => l.type === "rent" && !alreadyShown.has(l.id))
    .sort((a, b) => a.priceUGX - b.priceUGX)
    .slice(0, RAIL_SIZE);

  return (
    <main className="flex-1 bg-white">
      {/*
        Hero as a contained panel rather than a full-bleed band: it sits
        in the same column and carries the same rounded corners and
        ink-tinted shadow as the cards below, so the page reads as one
        system instead of a poster with a site underneath it.
      */}
      <section className="mx-auto max-w-[1760px] px-4 pt-6">
        <div className="relative isolate flex min-h-[440px] items-center overflow-hidden rounded-3xl shadow-[0_2px_4px_rgb(16_41_31/0.06),0_24px_56px_-16px_rgb(16_41_31/0.22)] md:min-h-[500px]">
          <Image
            src="/sample/photos/house-1.webp"
            alt=""
            fill
            priority
            quality={90}
            sizes="(min-width: 1792px) 1760px, 100vw"
            className="-z-20 object-cover object-center"
          />
          {/*
            Ink rather than black, to match the shadows and keep the
            photo warm. White clears AA from the left edge to past the
            middle; the eyebrow sits at the far left, where the scrim
            is heaviest, because it needs 90% to clear on its own.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-ink/70 md:bg-transparent md:bg-linear-to-r md:from-ink/92 md:via-ink/72 md:via-48% md:to-transparent md:to-82%"
          />

          <div className="w-full px-6 py-14 sm:px-10 md:px-14 md:py-16">
            {/*
              White, not mint: the scrim now opens up to show the photo,
              and mint needs ~90% ink behind it to clear 4.5:1 at 11px.
            */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              Uganda&rsquo;s property marketplace
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-[34px] font-extrabold leading-[1.05] text-white sm:text-[44px] md:text-[52px]">
              Homes. Rentals.
              <br />
              Land. All of Uganda.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/85">
              Every listing shows the tenure, whether the title was
              searched, and what it really costs to move in.
            </p>

            {/*
              One box, no tabs: /search already defaults to rentals when
              no type is given, and the three cards below cover buying and
              listing. A plain GET form, so it works before JavaScript
              does.
            */}
            <form
              action="/search"
              role="search"
              className="mt-7 flex max-w-xl items-center gap-1 rounded-xl bg-white p-1.5 shadow-[0_8px_24px_-8px_rgb(16_41_31/0.45)]"
            >
              <label htmlFor="hero-q" className="sr-only">
                Area, district or keyword
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="Enter an area, district or keyword, e.g. Ntinda"
                className="h-12 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-subtle"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark"
              >
                <Search className="size-5" />
              </button>
            </form>

            {/* The three ways in, for anyone who would rather browse. */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: "Rentals", href: "/search?type=rent" },
                { label: "Homes for sale", href: "/search?type=buy" },
                { label: "Land", href: "/search?type=land" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-full border border-white/35 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:border-white hover:bg-white/15"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/*
            CC BY-SA: the photographer is credited wherever the photo
            runs, not only in public/sample/photos/CREDITS.md. Remove this
            once a photo Zubia owns replaces it.
          */}
          <p className="absolute bottom-1.5 right-2 rounded bg-white/75 px-1.5 py-0.5 text-[9px] text-subtle">
            Photo: Alvinategyeka, CC BY-SA 4.0
          </p>
        </div>
      </section>

      {/*
        Two rails, not four. Four meant a visitor scrolled past roughly
        fifty photos before reaching anything they could act on, and a
        rail nobody reaches is a rail nobody sees. One mixed rail and one
        priced rail, then the three ways in.
      */}
      {recommended.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 pt-8 md:pt-10">
          <SectionHead
            title="Recommended."
            accent="Start here."
            blurb="A mix of hand-picked places, rentals, homes for sale and land - every card shows the tenure and what it really costs to move in."
            action={{ href: "/search", label: "Browse everything" }}
          />
          <FeaturedCarousel listings={recommended} label="Recommended listings" />
        </section>
      )}

      {affordable.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 pt-10 md:pt-12">
          <SectionHead
            title="Rentals on a budget."
            accent="Cheapest first."
            blurb="Sorted by monthly rent, lowest first, with the full move-in cost on every card."
            action={{ href: "/search?type=rent", label: "All rentals" }}
          />
          <FeaturedCarousel
            listings={affordable}
            label="Rentals on a budget"
            direction="right"
          />
        </section>
      )}

      {/* Buy / Rent / Sell */}
      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-6 md:pb-20 md:pt-8">
        <div className="grid gap-6 md:grid-cols-3">
          {TILES.map((tile) => (
            <div
              key={tile.title}
              /*
                What makes a solid panel look expensive rather than printed:
                light falling from above, a hairline where the top edge
                catches it, a ink-tinted layered shadow instead of one black
                blur, and a slow lift on hover.
              */
              className={`group relative isolate flex flex-col items-center overflow-hidden rounded-[20px] px-8 py-12 text-center ring-1 ring-inset ring-white/15 shadow-[0_1px_2px_rgb(16_41_31/0.06),0_12px_32px_-10px_rgb(16_41_31/0.18)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:ring-white/25 hover:shadow-[0_2px_6px_rgb(16_41_31/0.10),0_28px_60px_-14px_rgb(16_41_31/0.30)] ${tile.card}`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3 bg-linear-to-b from-white/14 to-transparent"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
              />

              {/*
                Frosted disc rather than a solid white one: the colour shows
                through it, so the icon belongs to the card instead of sitting
                on top of it.
              */}
              <span className="flex size-[60px] items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-inset ring-white/30 transition-all duration-500 group-hover:bg-white/20 group-hover:ring-white/55">
                <svg
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={tile.icon} />
                </svg>
              </span>

              <h3 className="mt-6 font-display text-[21px] font-extrabold tracking-[-0.02em] text-white">
                {tile.title}
              </h3>
              <p className="mb-8 mt-2.5 max-w-[30ch] flex-1 text-[14.5px] leading-[1.65] text-white/80">
                {tile.body}
              </p>

              {/* The arrow opens up on hover, so the card answers the cursor. */}
              <Link
                href={tile.href}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-7 text-[14.5px] font-semibold tracking-tight shadow-[0_2px_8px_rgb(16_41_31/0.20)] transition-all duration-300 ease-out hover:gap-3 hover:shadow-[0_6px_18px_rgb(16_41_31/0.30)] ${tile.button}`}
              >
                {tile.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
