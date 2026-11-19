"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

/** Gap between cards, matching the gap-4 on the track. */
const GAP = 16;

/** How long a page of cards rests before the strip advances, in ms. */
const PAGE_DELAY = 4500;

/** How long a manual nudge holds the auto-advance off, in ms. */
const RESUME_DELAY = 6000;

export function FeaturedCarousel({
  listings,
  label,
  direction = "left",
}: {
  listings: Listing[];
  /** Names the strip for screen readers; two on a page must differ. */
  label: string;
  /** Which way the strip advances on its own. */
  direction?: "left" | "right";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One listing cannot loop, so it just sits there.
  const loops = listings.length > 1;
  // Two copies of the strip, so paging can wrap with no visible seam.
  const items = loops ? [...listings, ...listings] : listings;

  /**
   * How far the strip travels before it is back on an identical card.
   *
   * Measured from the first clone rather than halving scrollWidth, which
   * would also count the track's own left and right padding.
   */
  const loopWidth = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | undefined;
    const firstClone = track?.children[listings.length] as HTMLElement | undefined;
    if (!first || !firstClone) return 0;
    return firstClone.offsetLeft - first.offsetLeft;
  }, [listings.length]);

  /**
   * One page: as many whole cards as are actually on screen.
   *
   * Always a whole number of cards, so every rest position lands on a card
   * edge rather than halfway through one.
   */
  const pageWidth = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | undefined;
    if (!track || !card) return 0;
    const stride = card.offsetWidth + GAP;
    const perPage = Math.max(1, Math.floor(track.clientWidth / stride));
    return perPage * stride;
  }, []);

  /**
   * Move one page, wrapping first if the step would run off either end.
   *
   * The wrap is set instantly and the step animated, so the jump between
   * identical copies is never seen.
   */
  const step = useCallback(
    (towards: -1 | 1, smooth: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const page = pageWidth();
      const span = loopWidth();
      if (page === 0) return;

      if (loops && span > 0) {
        if (towards === 1 && track.scrollLeft + page >= span) {
          track.scrollLeft -= span;
        } else if (towards === -1 && track.scrollLeft - page < 0) {
          track.scrollLeft += span;
        }
      }

      track.scrollBy({ left: towards * page, behavior: smooth ? "smooth" : "auto" });
    },
    [loops, loopWidth, pageWidth],
  );

  // A right-drifting strip starts on the second copy, so there is always a
  // page to its left to step back into.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loops || direction !== "right") return;
    track.scrollLeft = loopWidth();
  }, [loops, direction, loopWidth]);

  useEffect(() => {
    if (!loops || held) return;
    // Someone who asked their system for less motion gets a strip that
    // only ever moves when they press an arrow.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => step(direction === "left" ? 1 : -1, true),
      PAGE_DELAY,
    );
    return () => clearInterval(timer);
  }, [loops, held, direction, step]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const nudge = useCallback(
    (towards: -1 | 1) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      step(towards, !reduced);
      // Give the reader time with the page they asked for.
      setHeld(true);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => setHeld(false), RESUME_DELAY);
    },
    [step],
  );

  const arrow =
    "flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-clay hover:text-clay";

  return (
    <div
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      onTouchStart={() => setHeld(true)}
      onTouchEnd={() => setHeld(false)}
    >
      {/*
        snap-mandatory is what makes a "start" position exist: however the
        strip is moved - arrow, swipe or the timer - it comes to rest with
        a card flush to the left edge.
      */}
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1"
      >
        {items.map((listing, i) => {
          const clone = i >= listings.length;
          return (
            <div
              key={`${listing.id}-${i}`}
              className="w-[280px] shrink-0 snap-start"
              // The second copy is scenery: screen readers and the tab
              // order only ever see each listing once.
              {...(clone ? { inert: true, "aria-hidden": true } : {})}
            >
              <ListingCard listing={listing} anchor={!clone} />
            </div>
          );
        })}
      </div>

      {loops && (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => nudge(-1)} className={arrow} aria-label={`Previous, ${label}`}>
            <ChevronLeft className="size-[18px]" />
          </button>
          <button type="button" onClick={() => nudge(1)} className={arrow} aria-label={`Next, ${label}`}>
            <ChevronRight className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
