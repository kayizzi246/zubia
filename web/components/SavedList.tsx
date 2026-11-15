"use client";

import Link from "next/link";
import { useSavedIds } from "@/lib/saved-store";
import type { Listing } from "@/lib/types";
import { ListingCard } from "./ListingCard";

export function SavedList({ listings }: { listings: Listing[] }) {
  const savedIds = useSavedIds();
  const saved = listings.filter((l) => savedIds.includes(l.id));

  if (saved.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center">
        <p className="font-semibold text-ink">No saved homes yet</p>
        <p className="mt-1 text-sm text-subtle">
          Tap the heart on any listing to keep it here.
        </p>
        <Link
          href="/search?type=buy"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-white hover:bg-primary-dark"
        >
          Start searching
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {saved.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
