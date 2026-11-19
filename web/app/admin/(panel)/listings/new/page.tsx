import type { Metadata } from "next";
import { ListingForm } from "@/components/admin/ListingForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth";

export const metadata: Metadata = { title: "Add listing" };

export default async function NewListingPage() {
  await requirePermission("listings.manage");
  return (
    <>
      <PageHeader title="Add listing" description="Listings you add as admin can go live straight away." />
      <ListingForm />
    </>
  );
}
