import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";

/**
 * Option B - Photograph.
 *
 * One full-bleed photo behind a centred headline and the search panel.
 * The scrim is a solid navy wash rather than a soft gradient glow, so the
 * white type holds its contrast wherever the photo is bright.
 */

const DISTRICTS = ["Kampala", "Wakiso", "Entebbe", "Mukono"];

export function HeroPhoto() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/sample/photos/house-5.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Fixed wash: the headline must stay legible on any photo swapped in. */}
      <div className="absolute inset-0 -z-10 bg-ink/78" aria-hidden="true" />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-14 text-center md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mint">
          Homes &middot; Rentals &middot; Land
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-[30px] font-bold leading-[1.1] tracking-tight text-white sm:text-[38px] lg:text-[46px]">
          Find a place in Uganda
          <span className="block text-mint">without guessing who owns it.</span>
        </h1>
        <p className="mb-6 mt-2.5 max-w-lg text-[13px] leading-relaxed text-white/75">
          Every listing shows the tenure, whether the title was searched and
          what it really costs to move in.
        </p>

        <HeroSearch />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-white/55">
            Districts
          </span>
          {DISTRICTS.map((district) => (
            <Link
              key={district}
              href={`/search?type=rent&district=${district}`}
              className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:border-white hover:bg-white/10"
            >
              {district}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
