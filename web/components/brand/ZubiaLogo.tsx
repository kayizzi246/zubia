/*
  Zubia logo. The house mark is inline SVG so it stays crisp at every size and
  can be recoloured for dark backgrounds; the wordmark is live text in Poppins
  (font-display) so it scales and stays selectable.

  The original artwork lives in public/brand/zubia-logo.png.
*/

type Tone = "brand" | "light";

const ROOF_LEFT = { brand: "#1A6B4A", light: "#74CCA4" };
const ROOF_RIGHT = { brand: "#004BBB", light: "#FFFFFF" };
const WINDOW = { brand: "#1A6B4A", light: "#74CCA4" };

export function ZubiaMark({
  className = "size-7",
  tone = "brand",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* chimney, drawn first so the right roof face overlaps it cleanly */}
      <path d="M44 16h8v24h-8z" fill={ROOF_RIGHT[tone]} />
      <path d="M32 8v15L16 40H2z" fill={ROOF_LEFT[tone]} />
      <path d="M32 8l30 32H48L32 23z" fill={ROOF_RIGHT[tone]} />
      <g fill={WINDOW[tone]}>
        <rect x="26.8" y="29.5" width="4.6" height="4.6" />
        <rect x="32.6" y="29.5" width="4.6" height="4.6" />
        <rect x="26.8" y="35.3" width="4.6" height="4.6" />
        <rect x="32.6" y="35.3" width="4.6" height="4.6" />
      </g>
    </svg>
  );
}

/*
  Full lockup: mark + "Zubia" wordmark, with the tagline shown only where
  there is room for it (the footer and the sign-in / setup screens).
*/
export function ZubiaLogo({
  className = "",
  markClassName = "size-8",
  wordClassName = "text-[28px]",
  tone = "brand",
  tagline = false,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  tone?: Tone;
  tagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ZubiaMark className={markClassName} tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-wordmark font-bold tracking-tight ${wordClassName} ${
            tone === "light" ? "text-white" : "text-ink"
          }`}
        >
          Zubia
        </span>
        {tagline && (
          <span
            className={`mt-1 text-[9px] font-medium uppercase tracking-[0.18em] ${
              tone === "light" ? "text-white/70" : "text-subtle"
            }`}
          >
            Real Estate Online Broker
          </span>
        )}
      </span>
    </span>
  );
}
