import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { callLink, whatsappLink } from "@/lib/contact";
import { formatPhone } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { ContactQrToggle } from "./ContactQrToggle";

/** Makes a crisp SVG QR code on the server (no extra JavaScript in the browser). */
function qrSvg(text: string) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0B3D2E", light: "#FFFFFF" },
  });
}

/**
 * QR codes for desktop visitors: scan with a phone camera to open a WhatsApp
 * chat or start a call. Hidden on phones, where the buttons do the same job.
 */
export async function ContactQr({ listing }: { listing: Listing }) {
  const whatsapp = whatsappLink(listing);
  const call = callLink(listing);

  if (!whatsapp || !call) {
    return (
      <div className="mt-4 hidden items-center gap-3 rounded-lg border border-dashed border-line p-3 lg:flex">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface text-subtle">
          <QrCode className="size-7" />
        </span>
        <p className="text-xs text-subtle">
          A QR code to chat or call appears here once the seller adds a phone number.
        </p>
      </div>
    );
  }

  const [whatsappSvg, callSvg] = await Promise.all([qrSvg(whatsapp), qrSvg(call)]);

  return (
    <div className="mt-4 hidden lg:block">
      <ContactQrToggle whatsappSvg={whatsappSvg} callSvg={callSvg} phoneLabel={formatPhone(listing.sellerPhone!)} />
    </div>
  );
}
