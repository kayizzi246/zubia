import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";
import { SavedSearches } from "@/components/SavedSearches";
import { getPublicListings } from "@/lib/data/listings";

export const metadata: Metadata = {
  title: "Saved homes | Zubia",
};

export default async function SavedPage() {
  const listings = await getPublicListings();
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink">Saved homes</h1>
      <p className="mb-6 mt-1 text-subtle">
        Saved on this device. Sign in (coming soon) to keep them on your phone too.
      </p>
      <SavedSearches />
      <SavedList listings={listings} />
    </main>
  );
}
