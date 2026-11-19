import type { Metadata } from "next";
import { HeroCompact } from "@/components/home/heroes/HeroCompact";
import { HeroPhoto } from "@/components/home/heroes/HeroPhoto";
import { HeroSplit } from "@/components/home/heroes/HeroSplit";
import { getPublicListings } from "@/lib/data/listings";

/**
 * Throwaway page for choosing a hero. Delete this folder, and whichever
 * two heroes lose, once the decision is made.
 */
export const metadata: Metadata = {
  title: "Hero options",
  robots: { index: false, follow: false },
};

const OPTIONS = [
  {
    key: "A",
    name: "Split",
    note: "Light. Headline and search left, photography right. Starts the page on the same white as the sections below it, and has room for the live listing count.",
  },
  {
    key: "B",
    name: "Photograph",
    note: "Full-bleed photo behind a centred headline, navy wash over it. The most striking, and the heaviest: one large image before anything else loads.",
  },
  {
    key: "C",
    name: "Compact band",
    note: "Closest to what is there now, but half the height. Search sits beside the headline rather than under it, so featured listings reach the fold.",
  },
];

export default async function HeroPreviewPage() {
  const listingCount = (await getPublicListings()).length;

  const heroes = [
    <HeroSplit key="A" listingCount={listingCount} />,
    <HeroPhoto key="B" />,
    <HeroCompact key="C" />,
  ];

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-bold text-ink">Hero options</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-subtle">
          Three directions for the top of the home page, all on the flat,
          small-type system the rest of the page now uses. Pick one and it
          replaces the hero in{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">app/(site)/page.tsx</code>.
        </p>
      </div>

      {OPTIONS.map((option, i) => (
        <section key={option.key} className="pb-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-3 border-b border-line pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                Option {option.key}
              </p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-ink">
                {option.name}
              </h2>
              <p className="mt-0.5 max-w-2xl text-[12px] text-subtle">{option.note}</p>
            </div>
          </div>
          {/* The hero full-bleed, exactly as it would sit on the home page. */}
          <div className="border-y border-line bg-white">{heroes[i]}</div>
        </section>
      ))}
    </main>
  );
}
