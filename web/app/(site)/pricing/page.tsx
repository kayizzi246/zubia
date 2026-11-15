import { Camera, Check, FileSearch, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing: list your property | Zubia",
  description: "Simple prices for owners, agents, agencies and developers listing property in Uganda.",
};

// TODO(owner): fill in every "UGX [PRICE]" below.
// TODO(flutterwave): connect "Get started" to Mobile Money / card checkout.

const PLANS = [
  {
    name: "Owner",
    audience: "Selling or renting out your own place",
    price: "UGX [PRICE]",
    unit: "per listing",
    cta: "List my property",
    topic: "plans",
    features: [
      "One listing, live for 30 days",
      "Up to 15 photos",
      "WhatsApp and call buttons",
      "Renew any time",
    ],
  },
  {
    name: "Agent Pro",
    audience: "Independent agents and brokers",
    price: "UGX [PRICE]",
    unit: "per month",
    cta: "Start Agent Pro",
    topic: "plans",
    highlight: true,
    features: [
      "Unlimited listings",
      "Verified agent badge",
      "Agent profile page",
      "Listing views and leads",
    ],
  },
  {
    name: "Agency & Developer",
    audience: "Teams, agencies and developers",
    price: "UGX [PRICE]",
    unit: "per month",
    cta: "Talk to us",
    topic: "plans",
    features: [
      "Everything in Agent Pro",
      "Team accounts",
      "Project pages for new developments",
      "Priority support",
    ],
  },
];

const EXTRAS = [
  {
    name: "Boost a listing",
    body: "Show your listing at the top of search and on the home page.",
    price: "From UGX [PRICE]",
    unit: "7, 14 or 30 days",
    icon: Rocket,
  },
  {
    name: "Title check",
    body: "We search the title at the land registry and add a \"Title checked\" badge.",
    price: "UGX [PRICE]",
    unit: "per title",
    icon: FileSearch,
  },
  {
    name: "Photo shoot",
    body: "A photographer visits and takes bright, clear photos of your property.",
    price: "UGX [PRICE]",
    unit: "per property",
    icon: Camera,
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="bg-primary-dark px-4 py-14 text-center">
        <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">List on Zubia</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/80">
          Reach buyers and renters across Kampala, Wakiso, Entebbe and Mukono. Pay with Mobile Money or card.
        </p>
      </section>

      <section className="mx-auto -mt-8 grid max-w-6xl gap-5 px-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-card border bg-white p-6 shadow-sm ${
              plan.highlight ? "border-primary ring-2 ring-primary" : "border-line"
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 self-start rounded-md bg-sun px-2 py-1 text-xs font-bold text-ink">Most popular</span>
            )}
            <h2 className="font-display text-2xl font-extrabold text-ink">{plan.name}</h2>
            <p className="text-sm text-subtle">{plan.audience}</p>
            <p className="mt-5 font-display text-3xl font-extrabold text-ink">{plan.price}</p>
            <p className="text-sm text-subtle">{plan.unit}</p>
            <ul className="my-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-ink">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={`/contact?topic=${plan.topic}&plan=${encodeURIComponent(plan.name)}`}
              className={`flex h-12 items-center justify-center rounded-lg font-semibold ${
                plan.highlight
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "border-2 border-primary text-primary hover:bg-primary/5"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-extrabold text-ink md:text-3xl">Pay-as-you-go extras</h2>
        <p className="mt-1 text-subtle">Add these to any listing, on any plan.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {EXTRAS.map((extra) => (
            <div key={extra.name} className="rounded-card border border-line p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <extra.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{extra.name}</h3>
              <p className="mt-1 text-sm text-subtle">{extra.body}</p>
              <p className="mt-4 font-display text-xl font-extrabold text-ink">{extra.price}</p>
              <p className="text-xs text-subtle">{extra.unit}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-card bg-surface p-4 text-sm text-ink">
          Online payment is coming soon. For now, tap a plan and we&apos;ll get back to you on WhatsApp or by email to
          set up your listing.
        </p>
      </section>
    </main>
  );
}
