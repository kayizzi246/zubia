import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";
import { TENURE_LABELS, TENURE_NOTES } from "@/lib/format";
import type { Bathroom, Tenure, UnitType } from "@/lib/types";
import {
  BATHROOM_LABELS,
  BATHROOM_NOTES,
  UNIT_LABELS,
  UNIT_LOCAL_NAMES,
  UNIT_NOTES,
  UNIT_TYPES,
  VIEWING_FEE_WARNING,
} from "@/lib/uganda";

export const metadata: Metadata = { title: "Help, renting and buying tips | Zubia" };

const FAQS = [
  {
    q: "How do I contact a seller?",
    a: "Open the listing and tap WhatsApp or Call. Your message goes straight to the owner or agent.",
  },
  {
    q: "What does \"Title checked\" mean?",
    a: "Zubia searched the title at the land registry and the details matched the listing on that date. It is not a guarantee of ownership, so always do your own search and use a lawyer before paying.",
  },
  {
    q: "How do I list my property?",
    a: "See the plans on the pricing page and tap the one that fits you. Owners pay per listing; agents and agencies pay monthly.",
    link: { href: "/pricing", label: "See plans" },
  },
  {
    q: "How do I save homes?",
    a: "Tap the heart on any listing. Saved homes and saved searches appear on the Saved homes page on this device.",
    link: { href: "/saved", label: "Saved homes" },
  },
  {
    q: "A listing looks wrong. What should I do?",
    a: "Don't send any money. Report it and we'll check it.",
    link: { href: "/contact?topic=report", label: "Report a listing" },
  },
];

export default function HelpPage() {
  return (
    <TextPage title="Help and buying tips" intro="Answers to common questions, and how to buy or rent safely in Uganda.">
      <h2>Common questions</h2>
      <div className="space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-card border border-line bg-white px-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {f.q}
              <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="pb-4 text-subtle">
              {f.a} {f.link && <Link href={f.link.href}>{f.link.label}</Link>}
            </p>
          </details>
        ))}
      </div>

      <h2>Buying land or a house safely</h2>
      <ul>
        <li>Visit the property in person, ideally twice, at different times of day.</li>
        <li>Get the title number and do a search at the land registry (Ministry of Lands) before paying.</li>
        <li>Meet the neighbours and the LC1 chairperson. Ask who uses the land and whether there are disputes.</li>
        <li>On mailo land, check for bibanja holders (people with a right to occupy).</li>
        <li>Use a lawyer for the sale agreement and the transfer.</li>
        <li>Never pay a &quot;booking fee&quot; or deposit by Mobile Money to someone you haven&apos;t met.</li>
      </ul>

      <h2>Renting safely</h2>
      <ul>
        <li>View the house before paying anything, and meet the landlord or their known agent.</li>
        <li>{VIEWING_FEE_WARNING}</li>
        <li>Get a written tenancy agreement with the rent, deposit and notice period.</li>
        <li>Keep receipts for every payment, including the deposit.</li>
        <li>
          In Uganda the landlord normally pays the broker&apos;s commission.
          If a broker asks you for a month&apos;s rent as their fee, ask why.
        </li>
      </ul>

      {/*
        The words used in rental adverts are not written down anywhere, so
        anybody renting for the first time has to learn them by being
        caught out. This glossary is the same vocabulary the search uses.
      */}
      <h2>Types of rooms and houses to rent</h2>
      <dl className="space-y-3">
        {UNIT_TYPES.map((u: UnitType) => (
          <div key={u}>
            <dt className="font-semibold">
              {UNIT_LABELS[u]}
              {UNIT_LOCAL_NAMES[u] && (
                <span className="font-normal text-subtle">
                  {" "}
                  &mdash; {UNIT_LOCAL_NAMES[u]}
                </span>
              )}
            </dt>
            <dd className="text-subtle">{UNIT_NOTES[u]}</dd>
          </div>
        ))}
      </dl>

      <h2>Self-contained, or shared?</h2>
      <p>
        This is the question to settle before you travel to see a place. It
        decides whether you walk across a yard at night and who else uses
        your shower.
      </p>
      <dl className="space-y-3">
        {(Object.keys(BATHROOM_LABELS) as Bathroom[]).map((b) => (
          <div key={b}>
            <dt className="font-semibold">{BATHROOM_LABELS[b]}</dt>
            <dd className="text-subtle">{BATHROOM_NOTES[b]}</dd>
          </div>
        ))}
      </dl>

      <h2>What it costs to move in</h2>
      <p>
        The monthly rent is not the number that stops people moving. Before
        you get the keys a landlord normally asks for rent in advance plus a
        refundable security deposit, so the cash you need is commonly three
        to four months&apos; rent in one go. Every rental on Zubia shows that
        total in shillings, broken down, so you can work out what you can
        afford before you spend money on transport to a viewing.
      </p>
      <p>
        One or two months in advance is usual. If somebody asks for three to
        six, that is not automatically wrong, but ask for a lower monthly
        rent in exchange and get the agreement in writing.
      </p>

      <h2>Types of tenure</h2>
      <p className="text-subtle">
        These matter when you are buying land or a house. If you are renting
        a room you can skip this part.
      </p>
      <dl className="space-y-3">
        {(Object.keys(TENURE_NOTES) as Tenure[]).map((t) => (
          <div key={t}>
            <dt className="font-semibold">{TENURE_LABELS[t]}</dt>
            <dd className="text-subtle">{TENURE_NOTES[t]}</dd>
          </div>
        ))}
      </dl>

      <h2>Still need help?</h2>
      <p>
        <Link href="/contact?topic=help">Send us a message</Link> and we&apos;ll get back to you.
      </p>
    </TextPage>
  );
}
