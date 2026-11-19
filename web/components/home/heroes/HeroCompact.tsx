import { BadgeCheck, Landmark, MessageCircle } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";

/**
 * Option C - Compact band.
 *
 * The shortest of the three: a shallow navy strip that gets the search
 * above the fold and the first listings into view immediately. The three
 * promises run along the bottom as one hairline-separated row instead of
 * sitting in boxes down the side.
 */

const POINTS = [
  { icon: Landmark, title: "Tenure on every listing", body: "Mailo, freehold, leasehold, kibanja or condominium." },
  { icon: BadgeCheck, title: "Title checks", body: "The badge means the title was searched at the registry." },
  { icon: MessageCircle, title: "Talk to sellers directly", body: "WhatsApp or call the owner or agent in one tap." },
];

export function HeroCompact() {
  return (
    <section className="bg-primary-dark">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 md:pt-10">
        <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-[1.1] tracking-tight text-white sm:text-[32px]">
              Homes. Rentals. Land.
              <span className="block text-mint">All of Uganda.</span>
            </h1>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/70">
              Search Kampala, Wakiso, Entebbe and Mukono, with the tenure on
              every listing.
            </p>
          </div>
          <HeroSearch />
        </div>

        <ul className="mt-7 grid gap-px overflow-hidden rounded-card bg-white/12 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="flex gap-2.5 bg-primary-dark p-3.5">
              <point.icon className="mt-0.5 size-4 shrink-0 text-mint" />
              <div>
                <p className="text-[12px] font-semibold text-white">{point.title}</p>
                <p className="text-[11px] leading-relaxed text-white/65">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
