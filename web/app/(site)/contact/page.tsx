import { Flag, Megaphone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm, ContactFormFromUrl } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact us | Zubia",
  description: "Questions, listing plans, advertising, or a listing that looks wrong.",
};

const REASONS = [
  { icon: Flag, title: "Report a listing", body: "Asked for money before a viewing? Photos that don't match? Tell us and we'll check it." },
  { icon: Megaphone, title: "Plans and advertising", body: "Agents, agencies and developers: we'll set up your account and listings." },
  { icon: MessageCircle, title: "Anything else", body: "Questions about Zubia, your account or how listings work." },
];

export default function ContactPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-12 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-ink">Contact us</h1>
        <p className="mt-2 text-lg text-subtle">We usually reply within one working day, on WhatsApp or by email.</p>
        <ul className="mt-8 space-y-5">
          {REASONS.map((r) => (
            <li key={r.title} className="flex gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-sm text-subtle">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-card border border-line bg-white p-6 shadow-sm">
        <Suspense fallback={<ContactForm />}>
          <ContactFormFromUrl />
        </Suspense>
      </div>
    </main>
  );
}
