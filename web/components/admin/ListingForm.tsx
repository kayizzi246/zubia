"use client";

import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { saveListing } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TENURE_LABELS } from "@/lib/format";
import { DISTRICTS } from "@/lib/search";
import type { AdminListing } from "@/lib/db/rows";
import type { ListingType } from "@/lib/types";
import {
  BATHROOM_LABELS,
  DEFAULT_MOVE_IN,
  POWER_LABELS,
  UNIT_LABELS,
  UNIT_LOCAL_NAMES,
  UNIT_TYPES,
  WATER_LABELS,
} from "@/lib/uganda";

interface Option {
  value: string;
  label: string;
}

const TYPE_OPTIONS: Option[] = [
  { value: "buy", label: "For sale" },
  { value: "rent", label: "For rent (price per month)" },
  { value: "land", label: "Land" },
];
const TENURE_OPTIONS: Option[] = Object.entries(TENURE_LABELS).map(([value, label]) => ({ value, label }));
const SELLER_OPTIONS: Option[] = [
  { value: "owner", label: "Owner" },
  { value: "broker", label: "Broker" },
  { value: "agency", label: "Agency" },
  { value: "developer", label: "Developer" },
];
const STATUS_OPTIONS: Option[] = [
  { value: "pending", label: "Pending (hidden)" },
  { value: "approved", label: "Approved (live on the site)" },
  { value: "rejected", label: "Rejected (hidden)" },
  { value: "archived", label: "Archived (hidden)" },
];
const DISTRICT_OPTIONS: Option[] = DISTRICTS.map((d) => ({ value: d, label: d }));

// --- Rental options -------------------------------------------------------
// "Not stated" is a real answer and different from "no": a listing that
// hasn't said where the toilet is must not be advertised as self-contained.
//
// It needs a non-empty value because Radix's Select throws on an empty
// string, and it cannot be "none" either, since that is a real value for
// the electricity field. The server maps this sentinel back to null.
const UNSET = "unset";
const NOT_STATED: Option = { value: UNSET, label: "Not stated" };

const UNIT_OPTIONS: Option[] = [
  NOT_STATED,
  ...UNIT_TYPES.map((u) => ({
    value: u,
    label: UNIT_LOCAL_NAMES[u]
      ? `${UNIT_LABELS[u]} (${UNIT_LOCAL_NAMES[u]})`
      : UNIT_LABELS[u],
  })),
];
const BATHROOM_OPTIONS: Option[] = [
  NOT_STATED,
  ...Object.entries(BATHROOM_LABELS).map(([value, label]) => ({ value, label })),
];
const WATER_OPTIONS: Option[] = [
  NOT_STATED,
  ...Object.entries(WATER_LABELS).map(([value, label]) => ({ value, label })),
];
const POWER_OPTIONS: Option[] = [
  NOT_STATED,
  ...Object.entries(POWER_LABELS).map(([value, label]) => ({ value, label })),
];
const YES_NO_OPTIONS: Option[] = [
  NOT_STATED,
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Turns a stored boolean back into the three-way select's value. */
function yesNo(value: boolean | null | undefined): string {
  return value == null ? UNSET : value ? "yes" : "no";
}

function Field({
  name,
  label,
  hint,
  error,
  className = "",
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Choice({
  name,
  options,
  defaultValue,
  invalid,
  onChange,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  invalid?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <Select name={name} defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger id={name} className="h-11 w-full bg-white" aria-invalid={invalid}>
        <SelectValue placeholder="Choose…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ListingForm({ listing }: { listing?: AdminListing }) {
  const [state, action, pending] = useActionState(saveListing, null);
  // Rentals are the bulk of the market, so a new listing starts as one.
  const [type, setType] = useState<ListingType>(listing?.type ?? "rent");
  const err = (field: string) => state?.errors?.[field];

  const text = (name: string, value?: string | number | null, props: React.ComponentProps<"input"> = {}) => (
    <Input
      id={name}
      name={name}
      defaultValue={value ?? ""}
      aria-invalid={!!err(name)}
      className="h-11 bg-white"
      {...props}
    />
  );

  return (
    <form
      // Submitting by hand stops React from clearing the form, so a
      // validation error keeps everything the admin typed.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-4 lg:grid-cols-3"
    >
      {listing && <input type="hidden" name="id" value={listing.id} />}

      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display font-bold">The basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field name="title" error={err("title")} label="Title" className="sm:col-span-2" hint="e.g. 3-bedroom house with garden">
              {text("title", listing?.title, { required: true, maxLength: 140 })}
            </Field>
            <Field name="type" error={err("type")} label="Type">
              <Choice name="type" invalid={!!err("type")} options={TYPE_OPTIONS} defaultValue={type} onChange={(v) => setType(v as ListingType)} />
            </Field>
            <Field name="priceUGX" error={err("priceUGX")} label={type === "rent" ? "Rent per month (UGX)" : "Price (UGX)"} hint="Full number, e.g. 450000000">
              {text("priceUGX", listing?.priceUGX, { inputMode: "numeric", required: true })}
            </Field>
            <Field name="area" error={err("area")} label="Area" hint="e.g. Ntinda, Kira, Seeta">
              {text("area", listing?.area, { required: true })}
            </Field>
            <Field name="district" error={err("district")} label="District">
              <Choice name="district" invalid={!!err("district")} options={DISTRICT_OPTIONS} defaultValue={listing?.district} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display font-bold">Property details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {type !== "land" && (
              <>
                <Field name="bedrooms" error={err("bedrooms")} label="Bedrooms">
                  {text("bedrooms", listing?.bedrooms, { inputMode: "numeric" })}
                </Field>
                <Field name="bathrooms" error={err("bathrooms")} label="Bathrooms">
                  {text("bathrooms", listing?.bathrooms, { inputMode: "numeric" })}
                </Field>
              </>
            )}
            <Field name="sizeDecimals" error={err("sizeDecimals")} label="Plot size (decimals)" hint="100 decimals = 1 acre">
              {text("sizeDecimals", listing?.sizeDecimals, { inputMode: "decimal", required: true })}
            </Field>
            <Field name="tenure" error={err("tenure")} label="Tenure">
              <Choice name="tenure" invalid={!!err("tenure")} options={TENURE_OPTIONS} defaultValue={listing?.tenure} />
            </Field>
            <Field name="sellerType" error={err("sellerType")} label="Listed by">
              <Choice name="sellerType" invalid={!!err("sellerType")} options={SELLER_OPTIONS} defaultValue={listing?.sellerType} />
            </Field>
            <Field name="sellerName" error={err("sellerName")} label="Seller or agent name" hint="Shown on the listing">
              {text("sellerName", listing?.sellerName)}
            </Field>
            <Field name="sellerPhone" error={err("sellerPhone")} label="WhatsApp / phone" hint="e.g. 0772 123 456">
              {text("sellerPhone", listing?.sellerPhone ? "0" + listing.sellerPhone.slice(3) : "", { inputMode: "tel" })}
            </Field>
            <Field name="description" error={err("description")} label="Description" className="sm:col-span-3">
              <Textarea id="description" name="description" defaultValue={listing?.description} rows={6} className="bg-white" />
            </Field>
          </CardContent>
        </Card>

        {/*
          What renters actually filter on. Without these a rental cannot be
          found by room type or by whether it is self-contained, so this
          card is the difference between a listing being discoverable and
          sitting invisible at the bottom of the results.
        */}
        {type === "rent" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display font-bold">Renting details</CardTitle>
              <CardDescription>
                How Ugandans search. Fill in the room type and the toilet at
                minimum, or this listing will be missed by people filtering
                for it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field name="unitType" error={err("unitType")} label="Room type">
                <Choice
                  name="unitType"
                  invalid={!!err("unitType")}
                  options={UNIT_OPTIONS}
                  defaultValue={listing?.unitType ?? UNSET}
                />
              </Field>
              <Field
                name="bathroom"
                error={err("bathroom")}
                label="Toilet and shower"
                hint="&quot;Self-contained&quot; means inside the unit"
              >
                <Choice
                  name="bathroom"
                  invalid={!!err("bathroom")}
                  options={BATHROOM_OPTIONS}
                  defaultValue={listing?.bathroom ?? UNSET}
                />
              </Field>
              <Field name="ownKitchen" error={err("ownKitchen")} label="Own kitchen">
                <Choice
                  name="ownKitchen"
                  invalid={!!err("ownKitchen")}
                  options={YES_NO_OPTIONS}
                  defaultValue={yesNo(listing?.ownKitchen)}
                />
              </Field>
              <Field name="water" error={err("water")} label="Water">
                <Choice
                  name="water"
                  invalid={!!err("water")}
                  options={WATER_OPTIONS}
                  defaultValue={listing?.water ?? UNSET}
                />
              </Field>
              <Field name="power" error={err("power")} label="Electricity">
                <Choice
                  name="power"
                  invalid={!!err("power")}
                  options={POWER_OPTIONS}
                  defaultValue={listing?.power ?? UNSET}
                />
              </Field>
              <Field name="fenced" error={err("fenced")} label="Fenced compound">
                <Choice
                  name="fenced"
                  invalid={!!err("fenced")}
                  options={YES_NO_OPTIONS}
                  defaultValue={yesNo(listing?.fenced)}
                />
              </Field>

              <Field
                name="advanceMonths"
                error={err("advanceMonths")}
                label="Rent in advance (months)"
                hint={`Normally ${DEFAULT_MOVE_IN.advanceMonths}. Over 2 is a lot.`}
              >
                {text("advanceMonths", listing?.moveIn?.advanceMonths, { inputMode: "numeric" })}
              </Field>
              <Field
                name="depositMonths"
                error={err("depositMonths")}
                label="Security deposit (months)"
                hint="Normally 1 at most"
              >
                {text("depositMonths", listing?.moveIn?.depositMonths, { inputMode: "numeric" })}
              </Field>
              <Field
                name="brokerFeeMonths"
                error={err("brokerFeeMonths")}
                label="Broker fee paid by tenant (months)"
                hint="Normally 0: the landlord pays the broker"
              >
                {text("brokerFeeMonths", listing?.moveIn?.brokerFeeMonths, { inputMode: "numeric" })}
              </Field>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display font-bold">Photos and location</CardTitle>
            <CardDescription>The first photo is the cover. Photos are enhanced automatically when uploaded.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <PhotoUploader initial={listing?.photos ?? []} />
              {err("photos") && <p className="mt-2 text-sm text-destructive">{err("photos")}</p>}
            </div>
            {/* TODO(mapbox): pick the location by dropping a pin on a map. */}
            <Field name="lat" error={err("lat")} label="Latitude" hint="Optional, e.g. 0.3476">
              {text("lat", listing?.lat || "", { inputMode: "decimal" })}
            </Field>
            <Field name="lng" error={err("lng")} label="Longitude" hint="Optional, e.g. 32.5825">
              {text("lng", listing?.lng || "", { inputMode: "decimal" })}
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="font-display font-bold">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field name="status" error={err("status")} label="Status">
              <Choice name="status" invalid={!!err("status")} options={STATUS_OPTIONS} defaultValue={listing?.status ?? "approved"} />
            </Field>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-white px-3">
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="block text-xs text-muted-foreground">Shown first and on the home page</span>
              </span>
              <Switch name="featured" defaultChecked={listing?.featured} />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-white px-3">
              <span>
                <span className="block text-sm font-medium">Title checked</span>
                <span className="block text-xs text-muted-foreground">Only after a land registry search</span>
              </span>
              <Switch name="titleChecked" defaultChecked={listing?.titleChecked} />
            </label>

            {state && !state.ok && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={pending} className="h-11 flex-1">
                {pending ? <Loader2 className="animate-spin" /> : <Save />}
                {listing ? "Save changes" : "Create listing"}
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link href="/admin/listings">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
