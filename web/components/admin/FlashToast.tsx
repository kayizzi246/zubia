"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Shows a one-off success toast after a redirect, e.g. "Listing saved". */
export function FlashToast({ message }: { message?: string }) {
  useEffect(() => {
    if (!message) return;
    toast.success(message);
    // Drop ?saved=... so a refresh doesn't show it again.
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(null, "", url);
  }, [message]);
  return null;
}
