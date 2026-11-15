"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { signInUser, signUpUser, type AuthResult } from "@/app/(site)/sign-in/actions";

const field =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-ink placeholder:text-subtle focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive";

function Field({
  id,
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      <input id={id} name={id} className={field} aria-invalid={!!error} {...props} />
      {error ? <p className="text-sm text-destructive">{error}</p> : hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

function Feedback({ state }: { state: AuthResult | null }) {
  if (!state || state.errors) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
    >
      {pending && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

/** Submit without React clearing the form, so mistakes are easy to fix. */
function submitWith(action: (data: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function SignInForm() {
  const [state, action, pending] = useActionState(signInUser, null);
  return (
    <form onSubmit={submitWith(action)} className="space-y-4" noValidate>
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field id="password" label="Password" type="password" autoComplete="current-password" />
      <Feedback state={state} />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState(signUpUser, null);
  const err = (k: string) => state?.errors?.[k];

  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <p className="mt-3 text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submitWith(action)} className="space-y-4" noValidate>
      <Field id="fullName" label="Full name" autoComplete="name" error={err("fullName")} />
      <Field id="email" label="Email" type="email" autoComplete="email" error={err("email")} />
      <Field id="phone" label="Phone (optional)" type="tel" autoComplete="tel" placeholder="0772 123 456" error={err("phone")} />
      <Field id="password" label="Password" type="password" autoComplete="new-password" error={err("password")} hint="At least 8 characters." />
      <Feedback state={state} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}

export function AuthForms() {
  const [tab, setTab] = useState<"in" | "up">("in");
  const tabClass = (on: boolean) =>
    `h-11 flex-1 rounded-md text-sm font-semibold ${on ? "bg-white text-ink shadow-sm" : "text-subtle hover:text-ink"}`;

  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-1 rounded-lg bg-surface p-1">
        <button type="button" role="tab" aria-selected={tab === "in"} onClick={() => setTab("in")} className={tabClass(tab === "in")}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={tab === "up"} onClick={() => setTab("up")} className={tabClass(tab === "up")}>
          Create account
        </button>
      </div>
      {tab === "in" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}
