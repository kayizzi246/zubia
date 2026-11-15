"use client";

import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { toggleSaved, useSavedIds } from "@/lib/saved-store";

export function SaveShareButtons({ id, title }: { id: string; title: string }) {
  const saved = useSavedIds().includes(id);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  const button =
    "flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface";

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => toggleSaved(id)} aria-pressed={saved} className={button}>
        <Heart className={`size-4 ${saved ? "fill-sun text-sun" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={share} className={button}>
        <Share2 className="size-4" />
        Share
      </button>
    </div>
  );
}
