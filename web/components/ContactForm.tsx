"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startTransition, useActionState } from "react";
import { sendContactMessage } from "@/app/(site)/contact/actions";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "report", label: "Report a suspicious listing" },
  { value: "plans", label: "Listing plans and pricing" },
  { value: "advertise", label: "Advertising on Zubia" },
  { value: "help", label: "Help with my account" },
];

const field =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-ink placeholder:text-subtle focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive";

/** Reads ?topic=, ?listing= and ?plan= from the URL. Must sit inside <Suspense>. */
export function ContactFormFromUrl() {
  const params = useSearchParams();
  return (
    <ContactForm
      topic={params.get("topic") ?? "general"}
      listingId={params.get("listing") ?? ""}
      plan={params.get("plan") ?? ""}
    />
  );
}

export function ContactForm({ topic = "general", listingId = "", plan = "" }: { topic?: string; listingId?: string; plan?: string }) {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  const err = (name: string) => state?.errors?.[name];
  const validTopic = TOPICS.some((t) => t.value === topic) ? topic : "general";

  if (state?.ok) {
    return (
      <div className="rounded-card border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <p className="mt-3 font-display text-xl font-bold text-ink">Message sent</p>
        <p className="mt-1 text-subtle">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="space-y-4"
    >
      {/* Trap for spam bots: hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="plan" value={plan} />

      <div className="space-y-1.5">
        <label htmlFor="topic" className="text-sm font-medium text-ink">What is this about?</label>
        <select id="topic" name="topic" defaultValue={validTopic} className={field}>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {listingId && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm text-ink">
          About listing <b>{listingId}</b>
        </p>
      )}
      {plan && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm text-ink">
          Plan: <b>{plan}</b>
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink">Your name</label>
        <input id="name" name="name" autoComplete="name" className={field} aria-invalid={!!err("name")} />
        {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-ink">Phone or WhatsApp</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0772 123 456" className={field} aria-invalid={!!err("phone")} />
          {err("phone") && <p className="text-sm text-destructive">{err("phone")}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">Email (optional)</label>
          <input id="email" name="email" type="email" autoComplete="email" className={field} aria-invalid={!!err("email")} />
          {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium text-ink">Message</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          className={`${field} h-auto py-3`}
          aria-invalid={!!err("message")}
          placeholder={validTopic === "report" ? "What looks wrong? e.g. asked for a deposit before a viewing." : ""}
        />
        {err("message") && <p className="text-sm text-destructive">{err("message")}</p>}
      </div>

      {state && !state.ok && !state.errors && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        Send message
      </button>
    </form>
  );
}
