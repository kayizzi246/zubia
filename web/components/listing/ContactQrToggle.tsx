"use client";

import { useState } from "react";

interface ContactQrToggleProps {
  /** SVG markup made by the `qrcode` library on the server from our own links. */
  whatsappSvg: string;
  callSvg: string;
  phoneLabel: string;
}

export function ContactQrToggle({ whatsappSvg, callSvg, phoneLabel }: ContactQrToggleProps) {
  const [mode, setMode] = useState<"whatsapp" | "call">("whatsapp");
  const tab = (on: boolean) =>
    `h-9 flex-1 rounded-md text-sm font-semibold ${on ? "bg-white text-ink shadow-sm" : "text-subtle hover:text-ink"}`;

  return (
    <div className="rounded-lg border border-line p-3">
      <div role="tablist" aria-label="QR code type" className="flex gap-1 rounded-lg bg-surface p-1">
        <button type="button" role="tab" aria-selected={mode === "whatsapp"} onClick={() => setMode("whatsapp")} className={tab(mode === "whatsapp")}>
          WhatsApp
        </button>
        <button type="button" role="tab" aria-selected={mode === "call"} onClick={() => setMode("call")} className={tab(mode === "call")}>
          Call
        </button>
      </div>

      {/* 160px: big enough for older phone cameras to read the dense WhatsApp code. */}
      <div className="mt-3 flex flex-col items-center gap-2 text-center">
        <div
          role="img"
          aria-label={mode === "whatsapp" ? "QR code to chat on WhatsApp" : `QR code to call ${phoneLabel}`}
          className="size-40 shrink-0 [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: mode === "whatsapp" ? whatsappSvg : callSvg }}
        />
        <p className="text-sm text-ink">
          <span className="block font-semibold">Scan with your phone</span>
          <span className="text-subtle">
            {mode === "whatsapp"
              ? "Point your camera here to open a WhatsApp chat with the seller."
              : `Point your camera here to call ${phoneLabel}.`}
          </span>
        </p>
      </div>
    </div>
  );
}
