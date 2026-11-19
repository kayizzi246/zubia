import { cacheLife } from "next/cache";
import { DISTRICTS, MOVE_IN_STEPS, PRICE_STEPS, sortOptionsFor } from "@/lib/search";
import {
  BATHROOM_LABELS,
  BATHROOM_NOTES,
  POWER_LABELS,
  TYPICAL_RENT,
  UNIT_LABELS,
  UNIT_LOCAL_NAMES,
  UNIT_NOTES,
  UNIT_TYPES,
  WATER_LABELS,
  VIEWING_FEE_WARNING,
} from "@/lib/uganda";
import type { Bathroom, Power, Water } from "@/lib/types";
import { ok } from "../_lib/respond";

/*
  GET /api/v1/meta

  The vocabulary and the filter options, served to the client.

  This exists so the Flutter app does not hardcode "Single room (muzigo)"
  and the price bands in Dart. If a room type is added, or a label is
  reworded, the app picks it up without needing a release on the Play Store
  — which matters when your users are on cheap Android phones that update
  apps rarely, over expensive data.

  Cached for a day: this changes when the code changes, not per request.
*/

/**
 * Cached for a day with "use cache", the same mechanism the site's pages
 * use. A route segment `revalidate` export is not allowed alongside this
 * project's cacheComponents setting.
 *
 * Nothing here touches the database, so this only saves rebuilding the
 * object; the point is that the app can poll it cheaply on startup.
 */
async function metaPayload() {
  "use cache";
  cacheLife("days");

  return {
    /** Room types, in the order people shop, cheapest and smallest first. */
    unitTypes: UNIT_TYPES.map((u) => ({
      value: u,
      label: UNIT_LABELS[u],
      /** The Luganda or street word, where there is one. */
      localName: UNIT_LOCAL_NAMES[u] ?? null,
      /** One plain sentence, for someone renting for the first time. */
      note: UNIT_NOTES[u],
      typicalRent: {
        lowUGX: TYPICAL_RENT[u].low,
        highUGX: TYPICAL_RENT[u].high,
      },
    })),

    /** Where the toilet and shower are. 'inside' means self-contained. */
    bathrooms: (Object.keys(BATHROOM_LABELS) as Bathroom[]).map((b) => ({
      value: b,
      label: BATHROOM_LABELS[b],
      note: BATHROOM_NOTES[b],
      selfContained: b === "inside",
    })),

    water: (Object.keys(WATER_LABELS) as Water[]).map((w) => ({
      value: w,
      label: WATER_LABELS[w],
    })),

    power: (Object.keys(POWER_LABELS) as Power[]).map((p) => ({
      value: p,
      label: POWER_LABELS[p],
    })),

    districts: DISTRICTS,

    /** Monthly rent bands for the budget picker, in UGX. */
    rentSteps: PRICE_STEPS.rent,
    buySteps: PRICE_STEPS.buy,
    landSteps: PRICE_STEPS.land,

    /** Bands for "how much can you raise to move in?", in UGX. */
    moveInSteps: MOVE_IN_STEPS,

    sorts: {
      rent: sortOptionsFor("rent"),
      buy: sortOptionsFor("buy"),
      land: sortOptionsFor("land"),
    },

    /** Shown on every rental in every client. */
    viewingFeeWarning: VIEWING_FEE_WARNING,
  };
}

export async function GET() {
  return ok(await metaPayload());
}
