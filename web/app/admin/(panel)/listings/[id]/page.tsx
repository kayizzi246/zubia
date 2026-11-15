import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/admin/ListingForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAdminListing } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  const listing = await getAdminListing(id);
  if (!listing) notFound();

  return (
    <>
      <PageHeader
        title="Edit listing"
        description={`Added ${new Date(listing.createdAt).toLocaleDateString("en-UG", { dateStyle: "medium" })}`}
        action={<StatusBadge status={listing.status} />}
      />
      <ListingForm listing={listing} />
    </>
  );
}
