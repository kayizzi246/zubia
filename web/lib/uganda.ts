// How Ugandans actually describe and look for a home to rent.
//
// The portals built for Europe and America ask "how many bedrooms and
// bathrooms?". In Uganda most people looking for a place to live ask three
// different questions, in this order:
//
//   1. What kind of unit is it?   single room, double room, bedsitter, 1 bedroom
//   2. Is it self-contained?      is the toilet and shower inside MY unit?
//   3. How much cash to move in?  advance + deposit + broker fee, not just rent
//
// Those three questions are what this file models. The labels are the words
// used on the street and in housing groups, not estate-agent English.

// A type-only import, so there is no runtime cycle with ./types, which
// re-exports the types declared below.
import type { Listing } from "./types";

/** The unit types people search for, smallest and cheapest first. */
export type UnitType =
  | "single_room"
  | "double_room"
  | "bedsitter"
  | "one_bedroom"
  | "two_bedroom"
  | "three_bedroom"
  | "house"
  | "bq"
  | "hostel";

/**
 * Where the toilet and shower are. This is the most important fact in a
 * Ugandan rental advert and the thing people are most often misled about,
 * so it gets its own field instead of a bathroom count.
 */
export type Bathroom = "inside" | "outside_private" | "shared";

/** Where the water comes from. Affects daily cost and reliability. */
export type Water = "piped_inside" | "piped_yard" | "shared_tap" | "borehole";

/** How electricity is paid for. Yaka is Uganda's prepaid meter. */
export type Power = "own_yaka" | "shared_meter" | "included" | "none";

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** Short label for chips, cards and dropdowns. */
export const UNIT_LABELS: Record<UnitType, string> = {
  single_room: "Single room",
  double_room: "Double room",
  bedsitter: "Bedsitter",
  one_bedroom: "1 bedroom",
  two_bedroom: "2 bedrooms",
  three_bedroom: "3+ bedrooms",
  house: "Whole house",
  bq: "Boys' quarters",
  hostel: "Hostel room",
};

/**
 * The local word, shown under the label so someone who knows only the
 * Luganda term still recognises what they are looking at.
 */
export const UNIT_LOCAL_NAMES: Partial<Record<UnitType, string>> = {
  single_room: "muzigo",
  double_room: "muzigo wa rooms bbiri",
  bq: "servants' quarters",
};

/** One plain sentence explaining the unit, for people renting for the first time. */
export const UNIT_NOTES: Record<UnitType, string> = {
  single_room:
    "One room. You sleep, sit and often cook in the same room. Usually one of many identical rooms in a line, sharing a yard. The cheapest way to rent.",
  double_room:
    "Two rooms joined together, so you can keep the sitting room separate from where you sleep. A step up from a single room.",
  bedsitter:
    "One bigger room with its own kitchen corner and its own bathroom inside. Sometimes advertised as a studio.",
  one_bedroom:
    "A separate bedroom, plus a sitting room, kitchen and its own bathroom.",
  two_bedroom: "Two separate bedrooms, a sitting room and a kitchen.",
  three_bedroom:
    "Three or more bedrooms. Usually a family house or a large flat.",
  house: "A whole house on its own compound. You are the only tenant.",
  bq: "A small separate unit in the compound of a bigger house. Usually one or two rooms with its own entrance.",
  hostel:
    "A room in a student hostel, usually near a university, often shared.",
};

export const BATHROOM_LABELS: Record<Bathroom, string> = {
  inside: "Self-contained",
  outside_private: "Own toilet outside",
  shared: "Shared toilet",
};

export const BATHROOM_NOTES: Record<Bathroom, string> = {
  inside:
    "The toilet and shower are inside your own unit. Nobody else uses them.",
  outside_private: "The toilet and shower are in the yard but only you use them.",
  shared:
    "You share the toilet and shower with the other tenants in the yard.",
};

export const WATER_LABELS: Record<Water, string> = {
  piped_inside: "Tap inside",
  piped_yard: "Tap in the yard",
  shared_tap: "Shared tap",
  borehole: "Borehole or well",
};

export const POWER_LABELS: Record<Power, string> = {
  own_yaka: "Own Yaka meter",
  shared_meter: "Shared meter",
  included: "Power included in rent",
  none: "No power connected",
};

/**
 * "Self-contained" is the phrase everybody uses, so treat it as its own
 * idea rather than making callers reason about where the bathroom is.
 * Accepts null for listings that haven't said, which are not self-contained
 * as far as a search is concerned: better to leave one out than to send
 * somebody across town to find a shared latrine.
 */
export function isSelfContained(
  bathroom: Bathroom | null | undefined,
): boolean {
  return bathroom === "inside";
}

// ---------------------------------------------------------------------------
// Unit types, in the order people shop
// ---------------------------------------------------------------------------

/** The order the room-type picker uses: what most people need, first. */
export const UNIT_TYPES: UnitType[] = [
  "single_room",
  "double_room",
  "bedsitter",
  "one_bedroom",
  "two_bedroom",
  "three_bedroom",
  "house",
  "bq",
  "hostel",
];

/**
 * Typical monthly rent in and around Kampala, in UGX. Used to set sensible
 * budget steps and to flag an asking price that looks far off. Ranges are
 * indicative, drawn from Ugandan listing sites and press reports in
 * 2025-2026, and are wide on purpose because location changes everything.
 */
export const TYPICAL_RENT: Record<UnitType, { low: number; high: number }> = {
  single_room: { low: 100_000, high: 400_000 },
  double_room: { low: 200_000, high: 600_000 },
  bedsitter: { low: 300_000, high: 900_000 },
  one_bedroom: { low: 400_000, high: 1_500_000 },
  two_bedroom: { low: 700_000, high: 3_000_000 },
  three_bedroom: { low: 1_200_000, high: 6_000_000 },
  house: { low: 1_500_000, high: 10_000_000 },
  bq: { low: 200_000, high: 700_000 },
  hostel: { low: 100_000, high: 600_000 },
};

// ---------------------------------------------------------------------------
// Move-in cost
// ---------------------------------------------------------------------------

/**
 * What a tenant must actually find before they get the keys. Guides for
 * Kampala tell people to budget three to four months' rent, and this is
 * where tenants are most often caught out, so Zubia states it in shillings
 * instead of leaving it to be discovered at the viewing.
 */
export interface MoveInTerms {
  /** Months of rent paid up front. One or two is normal; more needs a reason. */
  advanceMonths: number;
  /** Refundable security deposit, in months of rent. Normally one at most. */
  depositMonths: number;
  /**
   * The broker's commission charged TO THE TENANT, in months of rent.
   * Custom in Uganda is that the landlord pays the broker, so this is
   * normally 0 and anything above it is worth questioning.
   */
  brokerFeeMonths: number;
}

export const DEFAULT_MOVE_IN: MoveInTerms = {
  advanceMonths: 1,
  depositMonths: 1,
  brokerFeeMonths: 0,
};

/** Total cash needed before moving in, in shillings. */
export function moveInTotal(rentUGX: number, terms: MoveInTerms): number {
  const months =
    terms.advanceMonths + terms.depositMonths + terms.brokerFeeMonths;
  return Math.round(rentUGX * months);
}

export interface MoveInRow {
  label: string;
  months: number;
  amountUGX: number;
  note?: string;
}

/** Each part of the move-in cost, for the breakdown on a listing page. */
export function moveInBreakdown(
  rentUGX: number,
  terms: MoveInTerms,
): MoveInRow[] {
  const rows: MoveInRow[] = [
    {
      label:
        terms.advanceMonths === 1 ? "First month's rent" : "Rent in advance",
      months: terms.advanceMonths,
      amountUGX: rentUGX * terms.advanceMonths,
      note:
        terms.advanceMonths > 2
          ? "More than two months in advance is a lot. Ask for a lower monthly rent in exchange."
          : undefined,
    },
    {
      label: "Security deposit",
      months: terms.depositMonths,
      amountUGX: rentUGX * terms.depositMonths,
      note:
        terms.depositMonths > 1
          ? "A deposit above one month's rent is unusual. Agree in writing how you get it back."
          : "Refundable when you leave, if nothing is damaged. Get it in writing.",
    },
    {
      label: "Broker fee",
      months: terms.brokerFeeMonths,
      amountUGX: rentUGX * terms.brokerFeeMonths,
      note:
        terms.brokerFeeMonths > 0
          ? "In Uganda the landlord usually pays the broker. Ask why you are being charged."
          : "The landlord pays the broker on this one. You pay nothing.",
    },
  ];
  return rows.filter((r) => r.months > 0 || r.label === "Broker fee");
}

/**
 * Warnings a tenant should see before they pay anybody. These are the
 * patterns behind most rental complaints and scams reported in Kampala.
 */
export function moveInWarnings(terms: MoveInTerms): string[] {
  const out: string[] = [];
  if (terms.advanceMonths >= 3)
    out.push(
      `${terms.advanceMonths} months' rent in advance is high. Never pay before you have seen the unit and met the landlord.`,
    );
  if (terms.depositMonths > 1)
    out.push(
      "The deposit is more than one month's rent. Ask for it in writing.",
    );
  if (terms.brokerFeeMonths > 0)
    out.push(
      "You are being asked to pay the broker. Landlords normally pay that fee in Uganda.",
    );
  return out;
}

/**
 * How an asking rent compares with what this kind of unit normally costs
 * around Kampala. A first-time renter has no reference point, so saying
 * "this is above the usual range" gives them something to bargain with.
 * Returns null when we have nothing to compare against.
 */
export function rentVersusTypical(
  unitType: UnitType | null | undefined,
  rentUGX: number,
): { verdict: "low" | "normal" | "high"; low: number; high: number } | null {
  if (!unitType) return null;
  const { low, high } = TYPICAL_RENT[unitType];
  const verdict = rentUGX < low ? "low" : rentUGX > high ? "high" : "normal";
  return { verdict, low, high };
}

/** The listing's own terms, or the normal Ugandan terms if it hasn't said. */
export function listingMoveInTerms(listing: Listing): MoveInTerms {
  return listing.moveIn ?? DEFAULT_MOVE_IN;
}

/** Cash this listing needs before the keys change hands. */
export function listingMoveInTotal(listing: Listing): number {
  return moveInTotal(listing.priceUGX, listingMoveInTerms(listing));
}

/** Never pay a viewing fee. Shown on every rental. */
export const VIEWING_FEE_WARNING =
  "Never pay a fee just to be shown a house. Real brokers are paid when you move in, not for a viewing.";
