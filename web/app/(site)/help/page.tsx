import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";
import { TENURE_LABELS, TENURE_NOTES } from "@/lib/format";
import type { Tenure } from "@/lib/types";

export const metadata: Metadata = { title: "Help and buying tips | Zubia" };

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
        <li>Get a written tenancy agreement with the rent, deposit and notice period.</li>
        <li>Keep receipts for every payment.</li>
      </ul>

      <h2>Types of tenure</h2>
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
