import { BadgeCheck, Plus, Search, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FlashToast } from "@/components/admin/FlashToast";
import { ListingActions } from "@/components/admin/ListingActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminListings } from "@/lib/data/admin";
import { formatListingPrice, TENURE_LABELS } from "@/lib/format";
import type { ListingStatus } from "@/lib/db/rows";

export const metadata: Metadata = { title: "Listings" };

const FILTERS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const TYPE_LABELS = { buy: "Sale", rent: "Rent", land: "Land" } as const;

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const params = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = pick(params.q);
  const status = FILTERS.find((f) => f.value === pick(params.status))?.value ?? "";
  const saved = pick(params.saved);

  const listings = await getAdminListings({ status: status || undefined, q });

  const filterHref = (value: string) => {
    const sp = new URLSearchParams();
    if (value) sp.set("status", value);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/admin/listings?${s}` : "/admin/listings";
  };

  return (
    <>
      <FlashToast message={saved === "created" ? "Listing created." : saved === "updated" ? "Listing saved." : undefined} />
      <PageHeader
        title="Listings"
        description="Approve new listings, feature the best ones and keep the site clean."
        action={
          <Button asChild className="h-11">
            <Link href="/admin/listings/new">
              <Plus /> Add listing
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-lg bg-white p-1 shadow-xs ring-1 ring-border">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={filterHref(f.value)}
              aria-current={status === f.value ? "page" : undefined}
              className={`flex h-9 items-center rounded-md px-3 text-sm font-medium ${
                status === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <form className="relative w-full sm:w-72" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search title, area, district" className="h-10 bg-white pl-9" aria-label="Search listings" />
        </form>
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="pl-4">Listing</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tenure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No listings match. {q && "Try a different search."}
                </TableCell>
              </TableRow>
            )}
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {listing.photos[0] && <Image src={listing.photos[0]} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/listings/${listing.id}`} className="block max-w-xs truncate font-semibold hover:underline">
                        {listing.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {listing.area}, {listing.district}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{TYPE_LABELS[listing.type]}</TableCell>
                <TableCell className="font-display font-bold">{formatListingPrice(listing)}</TableCell>
                <TableCell>{TENURE_LABELS[listing.tenure]}</TableCell>
                <TableCell>
                  <StatusBadge status={listing.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 text-muted-foreground">
                    {listing.featured && (
                      <span title="Featured">
                        <Star className="size-4 fill-primary text-primary" />
                        <span className="sr-only">Featured</span>
                      </span>
                    )}
                    {listing.titleChecked && (
                      <span title="Title checked">
                        <BadgeCheck className="size-4 text-primary" />
                        <span className="sr-only">Title checked</span>
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="pr-4">
                  <ListingActions listing={listing} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 text-sm text-muted-foreground">
        {listings.length} {listings.length === 1 ? "listing" : "listings"}
      </p>
    </>
  );
}
