"use client";

import { List, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import {
  applyFilters,
  DEFAULT_FILTERS,
  describeSearch,
  filtersToQuery,
  parseFilters,
  SORT_OPTIONS,
  type SearchFilters,
  type SortKey,
} from "@/lib/search";
import type { Listing } from "@/lib/types";
import { FilterBar } from "./FilterBar";

// Leaflet needs the browser's window, so the map loads only in the browser.
const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#e5ebe8] text-sm text-subtle">Loading map…</div>
  ),
});

interface SearchViewProps {
  listings: Listing[];
  filters: SearchFilters;
}

/** Reads filters from the URL. Must sit inside <Suspense>. */
export function SearchFromUrl({ listings }: { listings: Listing[] }) {
  const filters = parseFilters(useSearchParams());
  return <SearchView listings={listings} filters={filters} />;
}

export function SearchView({ listings, filters }: SearchViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const results = useMemo(() => applyFilters(listings, filters), [listings, filters]);

  function update(patch: Partial<SearchFilters>) {
    // Next.js picks up this URL change and re-renders with the new filters.
    window.history.replaceState(null, "", `/search?${filtersToQuery({ ...filters, ...patch })}`);
    setSelectedId(null);
  }

  return (
    <>
      <div className="shrink-0 border-b border-line bg-white">
        <FilterBar
          filters={filters}
          onChange={update}
          onClear={() => update({ ...DEFAULT_FILTERS, type: filters.type, sort: filters.sort })}
        />
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Map: fills the space on desktop; full screen on phones when toggled. */}
        <div className={`${mobileView === "map" ? "block" : "hidden"} min-w-0 flex-1 lg:block`}>
          <ListingsMap
            listings={results}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Results: scrolls on its own, like Zillow. */}
        <section
          aria-label="Results"
          className={`${mobileView === "list" ? "block" : "hidden"} w-full overflow-y-auto border-l border-line bg-white px-4 pb-24 pt-5 lg:block lg:w-[min(780px,46%)] lg:pb-8`}
        >
          <h1 className="font-display text-xl font-extrabold text-ink md:text-2xl">{describeSearch(filters)}</h1>
          <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-subtle" aria-live="polite">
              {results.length} {results.length === 1 ? "listing" : "listings"} · sample data
            </p>
            <label className="flex items-center gap-1 text-sm text-subtle">
              Sort:
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="h-11 cursor-pointer rounded-lg bg-transparent pr-1 font-semibold text-primary"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {results.length === 0 ? (
            <div className="rounded-card border border-line bg-surface p-8 text-center">
              <p className="font-semibold text-ink">No matching listings</p>
              <p className="mt-1 text-sm text-subtle">Try removing a filter or searching a nearby area.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  highlighted={listing.id === selectedId}
                  onHoverChange={setHoveredId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Phones: switch between list and map. */}
        <button
          type="button"
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          className="absolute bottom-5 left-1/2 z-[700] flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white shadow-xl lg:hidden"
        >
          {mobileView === "list" ? <MapIcon className="size-5" /> : <List className="size-5" />}
          {mobileView === "list" ? "Map" : "List"}
        </button>
      </div>
    </>
  );
}
