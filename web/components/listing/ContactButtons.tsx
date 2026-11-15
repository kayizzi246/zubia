import { Phone } from "lucide-react";
import { callLink, whatsappLink } from "@/lib/contact";
import type { Listing } from "@/lib/types";

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.4 12.4c-.2.6-1.1 1.1-1.6 1.1-.4.1-1 .1-3.1-.8-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.9.9-2.1c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z" />
    </svg>
  );
}

/** WhatsApp and Call buttons. Without a phone number, they explain why. */
export function ContactButtons({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const phone = listing.sellerPhone;
  const base = `flex flex-1 items-center justify-center gap-2 rounded-lg font-semibold ${compact ? "h-12" : "h-12 text-base"}`;

  if (!phone) {
    return (
      <div className="w-full">
        <div className="flex gap-2">
          <span className={`${base} cursor-not-allowed bg-surface text-subtle`} aria-disabled="true">
            <WhatsAppIcon /> WhatsApp
          </span>
          <span className={`${base} cursor-not-allowed border border-line text-subtle`} aria-disabled="true">
            <Phone className="size-5" /> Call
          </span>
        </div>
        {!compact && (
          <p className="mt-2 text-xs text-subtle">This is a sample listing, so it has no real contact details.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full gap-2">
      <a
        href={whatsappLink(listing)!}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-primary text-white hover:bg-primary-dark`}
      >
        <WhatsAppIcon /> WhatsApp
      </a>
      <a href={callLink(listing)!} className={`${base} border-2 border-primary text-primary hover:bg-primary/5`}>
        <Phone className="size-5" /> Call
      </a>
    </div>
  );
}
