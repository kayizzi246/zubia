import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchFromUrl, SearchView } from "@/components/search/SearchView";
import { getPublicListings } from "@/lib/data/listings";
import { DEFAULT_FILTERS } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search homes and land | Zubia",
};

export default async function SearchPage() {
  const listings = await getPublicListings();

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* Prerendered with default filters, then the browser applies the
          filters in the URL. Keeps the first load static and fast. */}
      <Suspense fallback={<SearchView listings={listings} filters={DEFAULT_FILTERS} />}>
        <SearchFromUrl listings={listings} />
      </Suspense>
    </main>
  );
}
