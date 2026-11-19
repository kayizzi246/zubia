import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";

/**
 * Option A - Split.
 *
 * A light hero: the headline and search on the left, real listing
 * photography on the right. Dropping the navy band means the page starts
 * on the same white as the sections under it, so the hero reads as the top
 * of one page rather than a separate poster stuck above it.
 */

const PHOTOS = [
  { src: "/sample/photos/house-5.webp", className: "row-span-2 aspect-[3/4]" },
  { src: "/sample/photos/apartment-2.webp", className: "aspect-[4/3]" },
  { src: "/sample/photos/area-1.webp", className: "aspect-[4/3]" },
];

export function HeroSplit({ listingCount }: { listingCount: number }) {
  const stats = [
    { value: String(listingCount), label: "live listings" },
    { value: "4", label: "districts" },
    { value: "100%", label: "show tenure" },
  ];

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            Uganda&rsquo;s property marketplace
          </p>
          <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[34px] lg:text-[40px]">
            Homes, rentals and land
            <span className="block text-primary">you can check before you pay.</span>
          </h1>
          <p className="mb-5 mt-2.5 max-w-md text-[13px] leading-relaxed text-subtle">
            Kampala, Wakiso, Entebbe and Mukono &mdash; with the tenure, the
            title status and the full move-in cost on every listing.
          </p>

          <HeroSearch variant="bare" />

          <dl className="mt-6 flex gap-6 border-t border-line pt-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-lg font-bold text-ink">
                    {stat.value}
                  </span>
                  <span className="block text-[11px] uppercase tracking-wide text-subtle">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Decorative: the listings themselves are the proof, not this. */}
        <div className="relative hidden grid-cols-2 gap-2 lg:grid" aria-hidden="true">
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className={`relative overflow-hidden rounded-card border border-line ${photo.className}`}
            >
              <Image src={photo.src} alt="" fill sizes="25vw" className="object-cover" />
            </div>
          ))}
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
            <BadgeCheck className="size-3.5 text-primary" />
            Title checked at the registry
          </span>
        </div>
      </div>
    </section>
  );
}
