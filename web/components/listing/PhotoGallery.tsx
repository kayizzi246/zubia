"use client";

import { Images } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Big photo + two smaller ones on desktop; "See all photos" opens every photo. */
export function PhotoGallery({ title, photos }: { title: string; photos: string[] }) {
  const [open, setOpen] = useState(false);
  if (photos.length === 0) {
    return <div className="aspect-[16/9] rounded-card bg-surface" />;
  }

  const [main, ...rest] = photos;
  const side = rest.slice(0, 2);

  return (
    <>
      <div className={`grid gap-2 overflow-hidden rounded-card ${side.length ? "md:grid-cols-[2fr_1fr]" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative aspect-[16/10] bg-surface md:aspect-auto md:h-[440px]"
          aria-label={`Open all ${photos.length} photos`}
        >
          <Image src={main} alt={`${title}, main photo`} fill preload loading="eager" sizes="(min-width: 768px) 66vw, 100vw" className="object-cover" />
        </button>
        {side.length > 0 && (
          <div className="hidden gap-2 md:grid md:grid-rows-2">
            {side.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(true)}
                className="relative bg-surface"
                aria-label={`Open photo ${i + 2}`}
              >
                <Image src={src} alt="" fill sizes="33vw" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface"
      >
        <Images className="size-4" />
        See all {photos.length} {photos.length === 1 ? "photo" : "photos"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogTitle className="font-display text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>{photos.length} photos</DialogDescription>
          <div className="grid gap-3">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-surface">
                <Image src={src} alt={`Photo ${i + 1} of ${photos.length}`} fill sizes="(min-width: 896px) 860px, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
