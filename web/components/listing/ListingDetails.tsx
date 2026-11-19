import { AlertTriangle, ArrowLeft, BadgeCheck, CircleHelp, Flag, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { getPublicListing, getPublicListings } from "@/lib/data/listings";
import {
  formatBathroom,
  formatListingPrice,
  formatPhone,
  formatPriceUGX,
  formatSize,
  formatUnitType,
  TENURE_LABELS,
  TENURE_NOTES,
} from "@/lib/format";
import type { Listing, SellerType } from "@/lib/types";
import {
  BATHROOM_NOTES,
  isSelfContained,
  listingMoveInTerms,
  listingMoveInTotal,
  moveInBreakdown,
  moveInWarnings,
  POWER_LABELS,
  rentVersusTypical,
  UNIT_LABELS,
  UNIT_NOTES,
  VIEWING_FEE_WARNING,
  WATER_LABELS,
} from "@/lib/uganda";
import { ContactButtons } from "./ContactButtons";
import { ContactQr } from "./ContactQr";
import { LocationMapLoader } from "./LocationMapLoader";
import { PhotoGallery } from "./PhotoGallery";
import { SaveShareButtons } from "./SaveShareButtons";

const TYPE_LABELS = { buy: "For sale", rent: "For rent", land: "Land for sale" } as const;
const SELLER_LABELS: Record<SellerType, string> = {
  owner: "Owner",
  broker: "Broker",
  agency: "Agency",
  developer: "Developer",
};

/** Placeholder while a listing loads. */
export function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-6">
      <div className="h-[300px] rounded-card bg-surface md:h-[440px]" />
      <div className="h-10 w-64 rounded bg-surface" />
      <div className="h-6 w-96 max-w-full rounded bg-surface" />
    </div>
  );
}

/**
 * Everything about one listing. Used by the full page (/listing/[id]) and by
 * the pop-up that opens over search results.
 */
export async function ListingDetails({ id, variant = "page" }: { id: string; variant?: "page" | "modal" }) {
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const similar = (await getPublicListings())
    .filter((l) => l.id !== listing.id && l.type === listing.type)
    .sort((a, b) => Number(b.district === listing.district) - Number(a.district === listing.district))
    .slice(0, 3);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        {variant === "page" && (
        <Link
          href={`/search?type=${listing.type}`}
          className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to search
        </Link>
        )}
        <PhotoGallery title={listing.title} photos={listing.photos} />
      </div>

      <div className="mx-auto mt-6 grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <Summary listing={listing} />
          {/*
            A renter needs to know what the move-in cash is. A buyer needs
            to know about the land title. They are different panels because
            they are different decisions.
          */}
          {listing.type === "rent" ? (
            <MoveInPanel listing={listing} />
          ) : (
            <TenurePanel listing={listing} />
          )}
          <section>
            <h2 className="mb-2 font-display text-xl font-bold text-ink">About this place</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink">{listing.description}</p>
          </section>
          <FactsTable listing={listing} />
          {(listing.lat !== 0 || listing.lng !== 0) && (
            <section>
              <h2 className="mb-1 font-display text-xl font-bold text-ink">Location</h2>
              <p className="mb-3 text-sm text-subtle">
                {listing.area}, {listing.district}. The pin is approximate; confirm the exact plot on a visit.
              </p>
              <LocationMapLoader lat={listing.lat} lng={listing.lng} />
            </section>
          )}
        </div>

        <aside className={`space-y-4 lg:sticky lg:self-start ${variant === "page" ? "lg:top-20" : "lg:top-4"}`}>
          <SellerCard listing={listing} />
          <SafetyTips listingId={listing.id} isRent={listing.type === "rent"} />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="mb-4 font-display text-2xl font-bold text-ink">Similar places</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Phones: WhatsApp and Call always within thumb reach. In the pop-up it
          sticks to the bottom of the pop-up instead of the screen. */}
      <div
        className={`${variant === "page" ? "fixed inset-x-0 bottom-0" : "sticky bottom-0 mt-8"} z-40 border-t border-line bg-white p-3 shadow-[0_-4px_16px_rgb(0_0_0/0.08)] lg:hidden`}
      >
        <ContactButtons listing={listing} compact />
      </div>
    </>
  );
}

function Summary({ listing }: { listing: Listing }) {
  const isRent = listing.type === "rent";
  const unitLabel = formatUnitType(listing);
  const bathroomLabel = formatBathroom(listing);

  // Plot size and bathroom counts are a buyer's measures. Someone renting
  // a room is told what the unit is and where the bathroom is instead.
  const facts = isRent
    ? []
    : ([
        listing.bedrooms !== null && { value: listing.bedrooms, label: listing.bedrooms === 1 ? "bed" : "beds" },
        listing.bathrooms !== null && { value: listing.bathrooms, label: listing.bathrooms === 1 ? "bath" : "baths" },
        { value: formatSize(listing.sizeDecimals).split(" ")[0], label: formatSize(listing.sizeDecimals).split(" ").slice(1).join(" ") },
      ].filter(Boolean) as { value: string | number; label: string }[]);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-ink">{TYPE_LABELS[listing.type]}</span>
            {isRent && unitLabel && (
              <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-ink">{unitLabel}</span>
            )}
            {isRent && isSelfContained(listing.bathroom) && (
              <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {bathroomLabel}
              </span>
            )}
            {listing.featured && <span className="rounded-md bg-primary-dark px-2 py-1 text-xs font-semibold text-white">Featured</span>}
          </div>
          <p className="font-display text-4xl font-extrabold tracking-tight text-ink">{formatListingPrice(listing)}</p>
          <h1 className="mt-1 text-lg text-ink">
            {listing.title}, {listing.area}, {listing.district}
          </h1>
        </div>
        <SaveShareButtons id={listing.id} title={listing.title} />
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="sr-only">{f.label}</dt>
            <dd>
              <span className="font-display text-2xl font-extrabold text-ink">{f.value}</span>{" "}
              <span className="text-subtle">{f.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * What this place costs to move into, itemised.
 *
 * Guides for Kampala tell tenants to budget three to four months' rent
 * before they get the keys, and the surprise is usually discovered at the
 * viewing. Putting the arithmetic on the page means someone can decide
 * whether to make the trip at all.
 */
function MoveInPanel({ listing }: { listing: Listing }) {
  const terms = listingMoveInTerms(listing);
  const total = listingMoveInTotal(listing);
  const rows = moveInBreakdown(listing.priceUGX, terms);
  const warnings = moveInWarnings(terms);
  const typical = rentVersusTypical(listing.unitType, listing.priceUGX);

  return (
    <section className="space-y-3">
      <div className="rounded-card border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm text-subtle">Cash needed before you move in</p>
        <p className="font-display text-3xl font-extrabold tracking-tight text-primary">
          {formatPriceUGX(total)}
        </p>
        <p className="mt-1 text-sm text-ink">
          That is {formatPriceUGX(listing.priceUGX)} a month, plus what the
          landlord asks for up front.
        </p>

        <dl className="mt-4 space-y-2 border-t border-primary/20 pt-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-ink">
                  {row.label}
                  {row.months > 0 && (
                    <span className="text-subtle">
                      {" "}
                      ({row.months} {row.months === 1 ? "month" : "months"})
                    </span>
                  )}
                </dt>
                <dd className="shrink-0 font-semibold text-ink">
                  {row.amountUGX === 0 ? "Nothing" : formatPriceUGX(row.amountUGX)}
                </dd>
              </div>
              {row.note && (
                <p className="mt-0.5 text-xs leading-relaxed text-subtle">
                  {row.note}
                </p>
              )}
            </div>
          ))}
        </dl>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-card border border-warning/40 bg-warning-tint p-4">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <AlertTriangle className="size-5 text-[#9a7200]" /> Worth asking about
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/*
        A reference point for the rent. Somebody renting their first room
        has no way of knowing whether 400,000 is fair for a single room, so
        state the usual range and let them judge.
      */}
      {typical && listing.unitType && (
        <div className="rounded-card border border-line p-4">
          <p className="text-sm text-subtle">Is this a fair rent?</p>
          <p className="mt-1 text-sm text-ink">
            A {UNIT_LABELS[listing.unitType].toLowerCase()} around Kampala
            usually goes for {formatPriceUGX(typical.low)} to{" "}
            {formatPriceUGX(typical.high)} a month.{" "}
            {typical.verdict === "high"
              ? "This one is above that range, so there is room to negotiate, or something here is better than usual."
              : typical.verdict === "low"
                ? "This one is below that range. Check why it is cheap before you pay: ask about water, power and the state of the toilet."
                : "This one is inside that range."}
          </p>
          <p className="mt-1 text-xs text-subtle">
            A rough guide only. The area, and whether the unit is
            self-contained, change the price a lot.
          </p>
        </div>
      )}

      {listing.bathroom && (
        <div className="rounded-card border border-line p-4">
          <p className="text-sm text-subtle">Toilet and shower</p>
          <p className="font-display text-xl font-bold text-ink">
            {formatBathroom(listing)}
          </p>
          <p className="mt-1 text-sm text-subtle">
            {BATHROOM_NOTES[listing.bathroom]}
          </p>
        </div>
      )}

      {listing.unitType && (
        <div className="rounded-card border border-line p-4">
          <p className="text-sm text-subtle">
            What a {UNIT_LABELS[listing.unitType].toLowerCase()} means
          </p>
          <p className="mt-1 text-sm text-ink">
            {UNIT_NOTES[listing.unitType]}
          </p>
        </div>
      )}
    </section>
  );
}

function TenurePanel({ listing }: { listing: Listing }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-card border border-line p-4">
        <p className="text-sm text-subtle">Tenure</p>
        <p className="font-display text-xl font-bold text-ink">{TENURE_LABELS[listing.tenure]}</p>
        <p className="mt-1 text-sm text-subtle">{TENURE_NOTES[listing.tenure]}</p>
      </div>
      {listing.titleChecked ? (
        <div className="rounded-card border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 font-display text-xl font-bold text-primary">
            <BadgeCheck className="size-6" /> Title checked
          </p>
          <p className="mt-1 text-sm text-ink">
            Zubia searched this title at the land registry. Always do your own search and use a lawyer before you pay.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-warning/40 bg-warning-tint p-4">
          <p className="flex items-center gap-1.5 font-display text-xl font-bold text-ink">
            <AlertTriangle className="size-5 text-[#9a7200]" /> Title not checked yet
          </p>
          <p className="mt-1 text-sm text-ink">
            Ask the seller for the title number and search it at the land registry before you pay anything.
          </p>
        </div>
      )}
    </section>
  );
}

function FactsTable({ listing }: { listing: Listing }) {
  const isRent = listing.type === "rent";
  const row = (k: string, v: string): [string, string] => [k, v];

  // Water and power are daily running costs in Uganda, and a shared meter
  // or no connection at all changes what the place really costs. They
  // belong in the facts, not buried in the description.
  const rentalRows: [string, string][] = isRent
    ? [
        ...(listing.unitType ? [row("Room type", UNIT_LABELS[listing.unitType])] : []),
        ...(listing.bathroom ? [row("Toilet and shower", formatBathroom(listing)!)] : []),
        ...(listing.ownKitchen != null
          ? [row("Kitchen", listing.ownKitchen ? "Own kitchen" : "No separate kitchen")]
          : []),
        ...(listing.water ? [row("Water", WATER_LABELS[listing.water])] : []),
        ...(listing.power ? [row("Electricity", POWER_LABELS[listing.power])] : []),
        ...(listing.fenced != null
          ? [row("Compound", listing.fenced ? "Fenced with a gate" : "Open compound")]
          : []),
      ]
    : [];

  const rows: [string, string][] = [
    row("Type", TYPE_LABELS[listing.type]),
    ...rentalRows,
    // Tenure and plot size are what you check before buying land.
    ...(isRent
      ? []
      : [
          row("Tenure", TENURE_LABELS[listing.tenure]),
          row(
            "Plot size",
            `${formatSize(listing.sizeDecimals)}${listing.sizeDecimals >= 100 ? ` (${listing.sizeDecimals} decimals)` : ""}`,
          ),
          ...(listing.bedrooms !== null ? [row("Bedrooms", String(listing.bedrooms))] : []),
          ...(listing.bathrooms !== null ? [row("Bathrooms", String(listing.bathrooms))] : []),
        ]),
    row("Area", listing.area),
    row("District", listing.district),
    row(
      "Listed by",
      isRent && listing.sellerType === "owner" ? "Landlord" : SELLER_LABELS[listing.sellerType],
    ),
    row("Listing ID", listing.id),
  ];
  return (
    <section>
      <h2 className="mb-2 font-display text-xl font-bold text-ink">Facts and features</h2>
      <dl className="grid overflow-hidden rounded-card border border-line sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line px-4 py-3 text-sm sm:odd:border-r">
            <dt className="text-subtle">{k}</dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SellerCard({ listing }: { listing: Listing }) {
  const name = listing.sellerName || `${SELLER_LABELS[listing.sellerType]} (name not shown)`;
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Listed by {SELLER_LABELS[listing.sellerType].toLowerCase()}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{name}</p>
      {listing.sellerPhone && <p className="text-sm text-subtle">{formatPhone(listing.sellerPhone)}</p>}
      <div className="mt-4 hidden lg:block">
        <ContactButtons listing={listing} />
      </div>
      <ContactQr listing={listing} />
      <p className="mt-3 text-xs text-subtle lg:hidden">Use the WhatsApp and Call buttons at the bottom of the screen.</p>
    </div>
  );
}

/**
 * The traps are different for renting and buying: a renter loses money to
 * viewing fees and advance rent paid to someone who isn't the landlord, a
 * buyer loses it to a bad title. Show the right list.
 */
function SafetyTips({ listingId, isRent }: { listingId: string; isRent: boolean }) {
  const tips = isRent
    ? [
        "See the actual room before you pay anything, and meet the landlord.",
        VIEWING_FEE_WARNING,
        "Get a written tenancy agreement saying the rent, the deposit and how you get the deposit back.",
        "Ask for a receipt for every payment, including the deposit.",
      ]
    : [
        "Visit the property before paying anything.",
        "Search the title at the land registry.",
        'Never send a "booking fee" by Mobile Money to a stranger.',
      ];

  return (
    <div className="rounded-card bg-surface p-5">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <ShieldAlert className="size-5 text-primary" /> Stay safe
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink">
        {tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-4">
        <Link href={`/contact?topic=report&listing=${listingId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <Flag className="size-4" /> Report this listing
        </Link>
        <Link href="/help" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <CircleHelp className="size-4" /> {isRent ? "Renting tips" : "Buying tips"}
        </Link>
      </div>
    </div>
  );
}
