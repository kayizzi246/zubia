"use client";

import { ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Pop-up that shows a listing over the page you were on (search, home, saved).
 * Closing it goes back, so the phone's back button also closes it.
 */
export function ListingModal({ href, children }: { href?: string; children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && router.back()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex h-dvh max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[94dvh] sm:max-w-6xl sm:rounded-2xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3">
          <DialogTitle className="sr-only">Listing details</DialogTitle>
          {/* Full page link: a real navigation, so the modal isn't used. */}
          {href ? (
          <a
            href={href}
            className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-surface"
          >
            <ExternalLink className="size-4" />
            Open full page
          </a>
          ) : (
            <span />
          )}
          <DialogClose
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <X className="size-6" />
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
