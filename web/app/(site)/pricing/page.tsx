import { Camera, Check, FileSearch, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing: list your property | Zubia",
  description:
    "Free to search, free to enquire, free to list your first property. Simple UGX prices for agents, agencies and developers in Uganda.",
};

/*
  Prices are proposals, not researched market rates: no Ugandan portal
  publishes its agent subscription, so there is nothing to copy. They are
  anchored to what the money on the other side of a deal looks like:

    - A broker commonly takes a full month's rent from the tenant, plus
      about 10% from the landlord, and 3-10% of a sale price. So a month
      of Agent Pro has to cost a small fraction of one closed deal, or no
      agent will keep paying for it.
    - A landlord letting one room earns UGX 300,000-800,000 a month. A
      listing fee has to be small in cash terms, not just in percent.
    - Uganda Property Centre lists for free. Charging owners to post at
      all would lose the supply side before it exists.

  Hence: free to list one property, charge the people who earn a living
  from the platform, and never charge the person looking for a home.

  TODO(owner): validate these against what agents will actually pay
  before launch - ask ten of them.
  TODO(flutterwave): connect the buttons to Mobile Money / card checkout.
*/

const PLANS = [
  {
    name: "Owner",
    audience: "Letting or selling your own place",
    price: "Free",
    unit: "first listing, 30 days",
    note: "Then UGX 20,000 per extra listing, 60 days",
    cta: "List my property",
    topic: "plans",
    features: [
      "One live listing, free",
      "Up to 8 photos",
      "WhatsApp and call buttons",
      "Renew or relist any time",
    ],
  },
  {
    name: "Agent Pro",
    audience: "Independent agents and brokers",
    price: "UGX 120,000",
    unit: "per month",
    note: "UGX 1,200,000 a year - two months free",
    cta: "Start Agent Pro",
    topic: "plans",
    highlight: true,
    features: [
      "Unlimited listings",
      "Verified agent badge",
      "Your own agent profile page",
      "Views, enquiries and lead reports",
      "First 14 days free",
    ],
  },
  {
    name: "Agency & Developer",
    audience: "Teams, agencies and developers",
    price: "UGX 400,000",
    unit: "per month",
    note: "Up to 10 agents. UGX 4,000,000 a year",
    cta: "Talk to us",
    topic: "plans",
    features: [
      "Everything in Agent Pro",
      "Team accounts and shared inbox",
      "Project pages for new developments",
      "Priority placement and support",
    ],
  },
];

const EXTRAS = [
  {
    name: "Boost a listing",
    body: "Show your listing at the top of search and on the home page.",
    price: "From UGX 25,000",
    unit: "25,000 / 7 days · 40,000 / 14 days · 70,000 / 30 days",
    icon: Rocket,
    tint: "bg-clay-tint text-clay",
  },
  {
    name: "Title check",
    body: "We search the title at the land registry and add a “Title checked” badge to your listing.",
    price: "UGX 120,000",
    unit: "per title",
    icon: FileSearch,
    tint: "bg-primary-tint text-primary",
  },
  {
    name: "Photo shoot",
    body: "A photographer visits and takes bright, clear photos of your property.",
    price: "UGX 150,000",
    unit: "per property, within Kampala, Wakiso, Entebbe and Mukono",
    icon: Camera,
    tint: "bg-sand text-ink",
  },
];

/* The part that makes the pricing fair, rather than merely cheap. */
const PROMISES = [
  {
    title: "Never a shilling from the person looking",
    body: "Searching, saving and contacting a landlord or agent is free, and always will be. Brokers already charge tenants a month's rent to be shown a room. Zubia will not add to that.",
  },
  {
    title: "No commission on your deal",
    body: "We do not take a percentage of your rent or your sale price. You pay for the listing, and what you agree with your tenant or buyer is yours.",
  },
  {
    title: "Pay with Mobile Money, in shillings",
    body: "MTN and Airtel Money, or a card. Prices are in UGX and include the Mobile Money charge, so what you are quoted is what leaves your account.",
  },
  {
    title: "Stop whenever you like",
    body: "Monthly plans are month to month, with no joining fee and no notice period. Your listings stay up until the month you paid for runs out.",
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1 bg-white">
      <section className="mx-auto max-w-[1500px] px-4 pt-12 text-center md:pt-16">
        <h1 className="font-display text-[32px] font-black leading-[1.1] text-ink md:text-[42px]">
          Free to look. <span className="text-primary">Fair to list.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-subtle">
          Nobody searching for a home pays Zubia anything. Your first listing
          is free too. Agents and agencies pay a flat monthly fee in shillings
          &mdash; never a cut of your deal.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-[1500px] gap-5 px-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-7 ${
              plan.highlight ? "border-primary ring-1 ring-primary" : "border-line"
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 self-start rounded-md bg-clay px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Most popular
              </span>
            )}
            <h2 className="font-display text-[22px] font-extrabold text-ink">
              {plan.name}
            </h2>
            <p className="mt-1 text-[14px] text-subtle">{plan.audience}</p>

            <p className="mt-6 font-display text-[30px] font-black leading-none text-ink">
              {plan.price}
            </p>
            <p className="mt-1.5 text-[14px] text-subtle">{plan.unit}</p>
            <p className="mt-1 text-[13px] font-medium text-clay">{plan.note}</p>

            <ul className="my-7 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-[15px] text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`/contact?topic=${plan.topic}&plan=${encodeURIComponent(plan.name)}`}
              className={`flex h-12 items-center justify-center rounded-lg text-[15px] font-semibold transition-colors ${
                plan.highlight
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "border border-primary text-primary hover:bg-primary-tint"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pt-16 md:pt-20">
        <h2 className="font-display text-[24px] font-black text-ink md:text-[28px]">
          Pay only when you need it.
        </h2>
        <p className="mt-2 text-[15px] text-subtle">
          One-off extras. Add them to any listing, on any plan, including the
          free one.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {EXTRAS.map((extra) => (
            <div key={extra.name} className="rounded-2xl border border-line p-6">
              <span
                className={`flex size-11 items-center justify-center rounded-xl ${extra.tint}`}
              >
                <extra.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-[18px] font-extrabold text-ink">
                {extra.name}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-subtle">
                {extra.body}
              </p>
              <p className="mt-5 font-display text-[22px] font-extrabold text-ink">
                {extra.price}
              </p>
              <p className="mt-1 text-[12px] text-subtle">{extra.unit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pt-16 md:pt-20">
        <h2 className="font-display text-[24px] font-black text-ink md:text-[28px]">
          What you will never be charged for.
        </h2>
        <dl className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {PROMISES.map((promise) => (
            <div key={promise.title}>
              <dt className="font-display text-[17px] font-extrabold text-ink">
                {promise.title}
              </dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-subtle">
                {promise.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-20 pt-10 md:pb-24">
        <p className="rounded-2xl bg-surface p-5 text-[14px] leading-relaxed text-ink">
          <strong className="font-semibold">Online payment is not switched on yet.</strong>{" "}
          Tap a plan and we will reply on WhatsApp or by email to set up your
          listing and take payment by Mobile Money. Prices are introductory and
          may change; anything you have already paid for runs to the end of its
          term at the price you paid.
        </p>
      </section>
    </main>
  );
}
