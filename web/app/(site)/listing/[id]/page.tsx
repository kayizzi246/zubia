import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingDetails, ListingSkeleton } from "@/components/listing/ListingDetails";
import { getPublicListing, getPublicListings } from "@/lib/data/listings";
import { formatListingPrice } from "@/lib/format";

// Prerender every live listing at build time; new ones render on first visit.
export async function generateStaticParams() {
  const listings = await getPublicListings();
  return listings.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/listing/[id]">): Promise<Metadata> {
  const listing = await getPublicListing((await params).id);
  if (!listing) return { title: "Listing not found | Zubia" };
  return {
    title: `${listing.title}, ${listing.area} – ${formatListingPrice(listing)} | Zubia`,
    description: listing.description.slice(0, 160),
  };
}

// The full page, used when a listing link is opened directly or shared.
// Clicking a listing inside the site opens app/@modal/(.)listing/[id] instead.
export default function ListingPage({ params }: PageProps<"/listing/[id]">) {
  return (
    <main className="flex-1 pb-28 lg:pb-12">
      <Suspense fallback={<ListingSkeleton />}>
        <ListingFromParams params={params} />
      </Suspense>
    </main>
  );
}

async function ListingFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetails id={id} />;
}
