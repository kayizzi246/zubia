"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

/** Gap between cards, matching the gap-4 on the track. */
const GAP = 16;

/**
 * A strip of listings that moves only when someone moves it.
 *
 * It used to advance itself every few seconds. It no longer does, and
 * that removed most of this file: there is no timer, no pausing on
 * hover, and no second copy of every card to let the loop wrap without
 * a visible seam.
 *
 * Dropping the clones halves the cards in the DOM and the images the
 * browser asks for, which matters more here than the loop did - these
 * pages are read on cheap phones over data paid for by the megabyte.
 *
 * What is left is a snap-scrolling strip: swipe it, or use the arrows,
 * which disable themselves at each end so they never look broken.
 */
export function FeaturedCarousel({
  listings,
  label,
}: {
  listings: Listing[];
  /** Names the strip for screen readers; two on a page must differ. */
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /**
   * One page: as many whole cards as are actually on screen.
   *
   * Always a whole number of cards, so every rest position lands on a
   * card edge rather than halfway through one.
   */
  const pageWidth = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | undefined;
    if (!track || !card) return 0;
    const stride = card.offsetWidth + GAP;
    const perPage = Math.max(1, Math.floor(track.clientWidth / stride));
    return perPage * stride;
  }, []);

  /** Which arrows still have somewhere to go. */
  const readEnds = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // A pixel of slack: fractional scroll positions mean scrollLeft
    // rarely lands exactly on either bound.
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    readEnds();
    track.addEventListener("scroll", readEnds, { passive: true });
    // A narrower window fits fewer cards, which can put a strip that was
    // mid-way at its end.
    window.addEventListener("resize", readEnds);
    return () => {
      track.removeEventListener("scroll", readEnds);
      window.removeEventListener("resize", readEnds);
    };
  }, [readEnds]);

  const nudge = useCallback(
    (towards: -1 | 1) => {
      const track = trackRef.current;
      const page = pageWidth();
      if (!track || page === 0) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      track.scrollBy({
        left: towards * page,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [pageWidth],
  );

  const arrow =
    "flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-clay hover:text-clay disabled:cursor-default disabled:border-line disabled:text-subtle/40 disabled:hover:border-line disabled:hover:text-subtle/40";

  // Arrows are pointless when everything already fits.
  const scrolls = listings.length > 1;

  return (
    <div>
      {/*
        snap-mandatory is what makes a "start" position exist: however
        the strip is moved - arrow or swipe - it comes to rest with a
        card flush to the left edge.
      */}
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1"
      >
        {listings.map((listing) => (
          <div key={listing.id} className="w-[280px] shrink-0 snap-start">
            <ListingCard listing={listing} anchor />
          </div>
        ))}
      </div>

      {scrolls && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            className={arrow}
            disabled={atStart}
            aria-label={`Previous, ${label}`}
          >
            <ChevronLeft className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            className={arrow}
            disabled={atEnd}
            aria-label={`Next, ${label}`}
          >
            <ChevronRight className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
