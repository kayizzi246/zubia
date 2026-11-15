import { Suspense } from "react";
import { ListingDetails, ListingSkeleton } from "@/components/listing/ListingDetails";
import { ListingModal } from "@/components/listing/ListingModal";

// Clicking a listing anywhere in the site opens it here, as a pop-up over the
// current page. Opening /listing/[id] directly (or refreshing) shows the full
// page in app/(site)/listing/[id] instead.
export default function ListingModalPage({ params }: PageProps<"/listing/[id]">) {
  return (
    // The listing id is only known at request time, so the pop-up streams in
    // behind this boundary; the fallback shows an empty pop-up straight away.
    <Suspense
      fallback={
        <ListingModal>
          <ListingSkeleton />
        </ListingModal>
      }
    >
      <ModalListing params={params} />
    </Suspense>
  );
}

async function ModalListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ListingModal href={`/listing/${id}`}>
      <Suspense fallback={<ListingSkeleton />}>
        <ListingDetails id={id} variant="modal" />
      </Suspense>
    </ListingModal>
  );
}
