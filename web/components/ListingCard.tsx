"use client";

import { ChevronLeft, ChevronRight, Link2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatBathroom,
  formatListingPrice,
  formatMoveIn,
  formatSize,
  formatUnitType,
} from "@/lib/format";
import { toggleSaved, useSavedIds } from "@/lib/saved-store";
import { isSelfContained } from "@/lib/uganda";
import type { Listing, SellerType } from "@/lib/types";
import { TenureBadge } from "./TenureBadge";

interface ListingCardProps {
  listing: Listing;
  /** Outlined when its map pin is selected. */
  highlighted?: boolean;
  onHoverChange?: (id: string | null) => void;
  /** False on a duplicated carousel copy, so the anchor id stays unique. */
  anchor?: boolean;
}

const SELLER_LABELS: Record<SellerType, string> = {
  owner: "Listed by owner",
  broker: "Listed by broker",
  agency: "Listed by agency",
  developer: "Listed by developer",
};

/** On a rental the owner is the landlord, which is the word people use. */
const RENT_SELLER_LABELS: Record<SellerType, string> = {
  ...SELLER_LABELS,
  owner: "Listed by landlord",
};

const TYPE_LABELS = {
  buy: "For sale",
  rent: "For rent",
  land: "Land for sale",
} as const;

/**
 * The one-line summary under the price.
 *
 * For a rental this is the room type and where the bathroom is, because
 * that is what someone decides on. Bed and bath counts are kept for sale
 * listings, where they are how buyers compare houses.
 */
function Facts({ listing }: { listing: Listing }) {
  const parts: React.ReactNode[] = [];

  if (listing.type === "rent") {
    const unitLabel = formatUnitType(listing);
    const bathroomLabel = formatBathroom(listing);
    if (unitLabel) parts.push(<b className="font-bold">{unitLabel}</b>);
    if (bathroomLabel) parts.push(bathroomLabel);
    // A rental with neither field set is older data; fall back to the
    // bedroom count so the card is never blank.
    if (parts.length === 0 && listing.bedrooms !== null)
      parts.push(
        <>
          <b className="font-bold">{listing.bedrooms}</b> bd
        </>,
      );
  } else {
    if (listing.bedrooms !== null)
      parts.push(<><b className="font-bold">{listing.bedrooms}</b> bd</>);
    if (listing.bathrooms !== null)
      parts.push(<><b className="font-bold">{listing.bathrooms}</b> ba</>);
    const [size, ...unit] = formatSize(listing.sizeDecimals).split(" ");
    parts.push(<><b className="font-bold">{size}</b> {unit.join(" ")}</>);
    parts.push(TYPE_LABELS[listing.type]);
  }

  return (
    <p className="text-[13.5px] text-ink">
      {parts.map((part, i) => (
        <span key={i} className="whitespace-nowrap">
          {i > 0 && <span className="px-1.5 text-subtle/60">|</span>}
          {part}
        </span>
      ))}
    </p>
  );
}

/** Swipe through photos with arrows (on hover) and dots, like the big portals. */
function PhotoCarousel({ listing }: { listing: Listing }) {
  const [index, setIndex] = useState(0);
  const count = listing.photos.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const arrow =
    "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink opacity-0 ring-1 ring-line transition-opacity group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <div className="relative aspect-[3/2] shrink-0 bg-surface">
      {count > 0 && (
        <Image
          src={listing.photos[index]}
          alt={`${listing.title}, photo ${index + 1} of ${count}`}
          fill
          quality={85}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      )}
      {count > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-2`}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-2`}>
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {listing.photos.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full ring-1 ring-ink/15 ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShareMenu({ listing }: { listing: Listing }) {
  const url = () => `${window.location.origin}/listing/${listing.id}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More options for ${listing.title}`}
        className="relative z-10 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-surface"
      >
        <MoreHorizontal className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onSelect={() => {
            const text = `${listing.title} – ${formatListingPrice(listing)} ${url()}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
          }}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
          </svg>
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            try {
              await navigator.clipboard.writeText(url());
              toast.success("Link copied");
            } catch {
              toast.error("Couldn't copy the link");
            }
          }}
        >
          <Link2 /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ListingCard({
  listing,
  highlighted = false,
  onHoverChange,
  anchor = true,
}: ListingCardProps) {
  const saved = useSavedIds().includes(listing.id);
  const isRent = listing.type === "rent";
  // "Title checked" is a buyer's concern, so a rental shows whether it is
  // self-contained instead: the thing renters actually look for.
  const tag = listing.featured
    ? "Featured"
    : isRent
      ? isSelfContained(listing.bathroom)
        ? "Self-contained"
        : null
      : listing.titleChecked
        ? "✓ Title checked"
        : null;

  return (
    <article
      id={anchor ? `listing-${listing.id}` : undefined}
      onMouseEnter={() => onHoverChange?.(listing.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      className={`group relative flex h-full scroll-mt-4 flex-col overflow-hidden rounded-card border border-line bg-white transition-colors hover:border-clay/50 ${
        highlighted ? "ring-2 ring-primary" : ""
      }`}
    >
      <PhotoCarousel listing={listing} />

      {tag && (
        <span
          className={`absolute left-2.5 top-2.5 z-10 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            listing.featured ? "bg-clay text-white" : "bg-white/95 text-primary"
          }`}
        >
          {tag}
        </span>
      )}

      {/* Sits above the full-card link so it can be clicked on its own. */}
      <button
        type="button"
        onClick={() => toggleSaved(listing.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
        className="absolute right-1 top-1 z-10 flex size-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[22px]"
          fill={saved ? "#1A6B4A" : "rgba(16,41,31,0.32)"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z" />
        </svg>
      </button>

      <div className="flex flex-1 flex-col space-y-1 px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[21px] font-extrabold leading-tight tracking-tight text-ink">
            {formatListingPrice(listing)}
          </p>
          <ShareMenu listing={listing} />
        </div>
        <Facts listing={listing} />

        {/*
          The lump sum needed before moving in. Stating it on the card
          means nobody travels to a viewing only to find the landlord
          wants four months' rent.
        */}
        {isRent && (
          <p className="text-[12.5px] font-semibold text-clay">
            {formatMoveIn(listing)}
          </p>
        )}

        <h3 className="truncate text-[13.5px] text-subtle">
          <Link href={`/listing/${listing.id}`} className="after:absolute after:inset-0">
            {listing.title}, {listing.area}, {listing.district}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            {(isRent ? RENT_SELLER_LABELS : SELLER_LABELS)[listing.sellerType]}
          </span>
          {/* Tenure matters to a buyer, not to someone renting a room. */}
          {!isRent && <TenureBadge tenure={listing.tenure} />}
        </div>
      </div>
    </article>
  );
}
