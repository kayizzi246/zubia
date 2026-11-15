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
import { formatListingPrice, formatSize } from "@/lib/format";
import { toggleSaved, useSavedIds } from "@/lib/saved-store";
import type { Listing, SellerType } from "@/lib/types";
import { TenureBadge } from "./TenureBadge";

interface ListingCardProps {
  listing: Listing;
  /** Outlined when its map pin is selected. */
  highlighted?: boolean;
  onHoverChange?: (id: string | null) => void;
}

const SELLER_LABELS: Record<SellerType, string> = {
  owner: "Listed by owner",
  broker: "Listed by broker",
  agency: "Listed by agency",
  developer: "Listed by developer",
};

const TYPE_LABELS = {
  buy: "For sale",
  rent: "For rent",
  land: "Land for sale",
} as const;

function Facts({ listing }: { listing: Listing }) {
  const parts: React.ReactNode[] = [];
  if (listing.bedrooms !== null)
    parts.push(<><b className="font-bold">{listing.bedrooms}</b> bd</>);
  if (listing.bathrooms !== null)
    parts.push(<><b className="font-bold">{listing.bathrooms}</b> ba</>);
  const [size, ...unit] = formatSize(listing.sizeDecimals).split(" ");
  parts.push(<><b className="font-bold">{size}</b> {unit.join(" ")}</>);
  parts.push(TYPE_LABELS[listing.type]);

  return (
    <p className="text-[15px] text-ink">
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
    "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100";

  return (
    <div className="relative aspect-[3/2] bg-surface">
      {count > 0 && (
        <Image
          src={listing.photos[index]}
          alt={`${listing.title}, photo ${index + 1} of ${count}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      )}
      {count > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-2`}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-2`}>
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {listing.photos.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/55"} shadow`}
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
        className="relative z-10 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-primary hover:bg-surface"
      >
        <MoreHorizontal className="size-6" />
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

export function ListingCard({ listing, highlighted = false, onHoverChange }: ListingCardProps) {
  const saved = useSavedIds().includes(listing.id);
  const tag = listing.featured ? "Featured" : listing.titleChecked ? "✓ Title checked" : null;

  return (
    <article
      id={`listing-${listing.id}`}
      onMouseEnter={() => onHoverChange?.(listing.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      className={`group relative scroll-mt-4 overflow-hidden rounded-card bg-white shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-shadow hover:shadow-[0_4px_16px_rgb(0_0_0/0.18)] ${
        highlighted ? "ring-2 ring-primary" : ""
      }`}
    >
      <PhotoCarousel listing={listing} />

      {tag && (
        <span
          className={`absolute left-2.5 top-2.5 z-10 rounded-md px-2 py-1 text-xs font-semibold ${
            listing.featured ? "bg-sun text-ink" : "bg-white/95 text-primary"
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
        className="absolute right-1.5 top-1.5 z-10 flex size-11 items-center justify-center rounded-full text-white drop-shadow hover:scale-110"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill={saved ? "#F2B705" : "rgba(18,32,26,0.3)"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z" />
        </svg>
      </button>

      <div className="space-y-1 px-3.5 pb-3.5 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink">
            {formatListingPrice(listing)}
          </p>
          <ShareMenu listing={listing} />
        </div>
        <Facts listing={listing} />
        <h3 className="truncate text-[15px] text-subtle">
          <Link href={`/listing/${listing.id}`} className="after:absolute after:inset-0">
            {listing.title}, {listing.area}, {listing.district}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            {SELLER_LABELS[listing.sellerType]}
          </span>
          <TenureBadge tenure={listing.tenure} />
        </div>
      </div>
    </article>
  );
}
