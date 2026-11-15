import Link from "next/link";
import { BadgeCheck, Landmark, MessageCircle } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { ListingCard } from "@/components/ListingCard";
import { TENURE_LABELS, TENURE_NOTES } from "@/lib/format";
import { getPublicListings } from "@/lib/data/listings";
import { DISTRICTS } from "@/lib/search";
import type { Tenure } from "@/lib/types";


const HERO_POINTS = [
  { icon: Landmark, title: "Tenure on every listing", body: "Mailo, freehold, leasehold, kibanja or condominium." },
  { icon: BadgeCheck, title: "Title checks", body: "Look for the badge: the title was searched at the registry." },
  { icon: MessageCircle, title: "Talk to sellers directly", body: "WhatsApp or call the owner or agent in one tap." },
];

const TILES = [
  {
    title: "Buy a home",
    body: "Houses and apartments for sale, with the tenure and title status on every listing.",
    cta: "Browse homes",
    href: "/search?type=buy",
    icon: "M4 11 12 4l8 7v9H4z M10 20v-5h4v5",
  },
  {
    title: "Rent a home",
    body: "Apartments and houses to rent, from self-contained units to family homes.",
    cta: "Find rentals",
    href: "/search?type=rent",
    icon: "M5 20V6h14v14 M9 10h2 M13 10h2 M9 14h2 M13 14h2",
  },
  {
    title: "Sell or list",
    body: "Owners pay per listing. Agents and developers get a monthly plan with a verified badge.",
    cta: "See plans",
    href: "/pricing",
    icon: "M4 20h16 M6 20V9l6-5 6 5v11 M12 9v6 M9 12h6",
  },
];


export default async function HomePage() {
  const listings = await getPublicListings();
  const featured = listings.filter((l) => l.featured);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-dark">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:pb-20 md:pt-14 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              Homes. Rentals. Land.{" "}
              <span className="block text-sun">All of Uganda.</span>
            </h1>
            <p className="mb-6 mt-3 max-w-lg text-base text-white/80 md:text-lg">
              Search Kampala, Wakiso, Entebbe and Mukono, with the tenure on every listing.
            </p>
            <HeroSearch />
          </div>

          {/* Why Zubia: fills the right side on desktop, hidden on phones to keep the hero short. */}
          <ul className="hidden space-y-3 lg:block">
            {HERO_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3 rounded-xl bg-white/6 p-4 ring-1 ring-white/10">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sun/15 text-sun">
                  <point.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{point.title}</p>
                  <p className="text-sm text-white/70">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG */}
        <img
          src="/hero-hills.svg"
          alt=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full object-cover object-bottom opacity-60 md:h-20"
        />
      </section>

      {/* Featured homes */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              Featured places
            </h2>
            <p className="text-subtle">Hand-picked listings across all four districts</p>
          </div>
          <Link
            href="/search?type=buy"
            className="flex min-h-11 shrink-0 items-center font-semibold text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {featured.map((listing) => (
            <div key={listing.id} className="w-[290px] shrink-0 snap-start">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </section>

      {/* Buy / Rent / Sell tiles */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 md:grid-cols-3">
        {TILES.map((tile) => (
          <div
            key={tile.title}
            className="flex flex-col items-center rounded-card border border-line bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-surface text-primary">
              <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                <path d={tile.icon} />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">{tile.title}</h3>
            <p className="mb-6 mt-2 flex-1 text-subtle">{tile.body}</p>
            <Link
              href={tile.href}
              className="flex min-h-11 items-center rounded-lg border-2 border-primary px-6 font-semibold text-primary hover:bg-primary hover:text-white"
            >
              {tile.cta}
            </Link>
          </div>
        ))}
      </section>

      {/* Districts */}
      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-5 font-display text-2xl font-bold text-ink md:text-3xl">
            Browse by district
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {DISTRICTS.map((district) => {
              const count = listings.filter((l) => l.district === district).length;
              return (
                <Link
                  key={district}
                  href={`/search?type=buy&district=${district}`}
                  className="group rounded-card border border-line bg-white p-5 hover:border-primary"
                >
                  <p className="font-display text-xl font-bold text-ink group-hover:text-primary">
                    {district}
                  </p>
                  <p className="text-sm text-subtle">
                    {count} {count === 1 ? "listing" : "listings"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tenure guide */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
          Know the tenure before you pay
        </h2>
        <p className="mb-6 mt-1 max-w-2xl text-subtle">
          Every Zubia listing shows how the land is held. Here is what each type
          means.
        </p>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(TENURE_NOTES) as Tenure[]).map((tenure) => (
            <div key={tenure} className="rounded-card border border-line p-4">
              <dt className="font-semibold text-ink">{TENURE_LABELS[tenure]}</dt>
              <dd className="mt-1 text-sm text-subtle">{TENURE_NOTES[tenure]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
