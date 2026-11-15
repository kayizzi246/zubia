"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { removeSavedSearch, useSavedSearches } from "@/lib/saved-searches";

export function SavedSearches() {
  const searches = useSavedSearches();
  if (searches.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-xl font-bold text-ink">Saved searches</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {searches.map((s) => (
          <li key={s.query} className="flex items-center gap-2 rounded-card border border-line bg-white p-2 pl-4">
            <Search className="size-4 shrink-0 text-primary" />
            <Link href={`/search?${s.query}`} className="min-w-0 flex-1 truncate py-2 font-medium text-ink hover:text-primary">
              {s.label}
            </Link>
            <button
              type="button"
              aria-label={`Remove saved search: ${s.label}`}
              onClick={() => removeSavedSearch(s.query)}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-subtle hover:bg-surface hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
