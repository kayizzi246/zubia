"use client";

import {
  Archive,
  BadgeCheck,
  Check,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteListing,
  setListingFlag,
  setListingStatus,
  type ActionResult,
} from "@/app/admin/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminListing } from "@/lib/supabase/rows";

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  return { pending, run };
}

/** Big Approve / Reject buttons, for the review queue. */
export function ReviewButtons({ id }: { id: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex gap-2">
      <Button size="sm" className="h-9" disabled={pending} onClick={() => run(() => setListingStatus(id, "approved"))}>
        <Check /> Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-9"
        disabled={pending}
        onClick={() => run(() => setListingStatus(id, "rejected"))}
      >
        <X /> Reject
      </Button>
    </div>
  );
}

/** The "…" menu on each row of the listings table. */
export function ListingActions({ listing }: { listing: AdminListing }) {
  const { pending, run } = useRun();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10" disabled={pending} aria-label={`Actions for ${listing.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Review</DropdownMenuLabel>
          {listing.status !== "approved" && (
            <DropdownMenuItem onSelect={() => run(() => setListingStatus(listing.id, "approved"))}>
              <Check /> Approve
            </DropdownMenuItem>
          )}
          {listing.status !== "rejected" && (
            <DropdownMenuItem onSelect={() => run(() => setListingStatus(listing.id, "rejected"))}>
              <X /> Reject
            </DropdownMenuItem>
          )}
          {listing.status !== "archived" && (
            <DropdownMenuItem onSelect={() => run(() => setListingStatus(listing.id, "archived"))}>
              <Archive /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => run(() => setListingFlag(listing.id, "featured", !listing.featured))}>
            <Star /> {listing.featured ? "Remove featured" : "Make featured"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => run(() => setListingFlag(listing.id, "title_checked", !listing.titleChecked))}
          >
            <BadgeCheck /> {listing.titleChecked ? "Remove title check" : "Mark title checked"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/listings/${listing.id}`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{listing.title}&quot; will be removed for good. To hide it but keep a record, archive it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => run(() => deleteListing(listing.id))}
            >
              Delete listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
