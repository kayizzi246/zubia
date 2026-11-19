"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { acceptInvite } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/rules";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvite, null);
  const err = (field: string) => state?.errors?.[field];

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-invalid={!!err("password")}
          aria-describedby="password-hint"
          className="h-11 bg-white"
        />
        <p id="password-hint" className="text-xs text-subtle">
          At least {MIN_PASSWORD_LENGTH} characters. A short phrase you can
          remember is stronger than one tricky word.
        </p>
        {err("password") && (
          <p className="text-sm text-destructive">{err("password")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Type it again</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!err("confirm")}
          className="h-11 bg-white"
        />
        {err("confirm") && (
          <p className="text-sm text-destructive">{err("confirm")}</p>
        )}
      </div>

      {state && !state.ok && !state.errors && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full text-base font-semibold">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Setting up…" : "Set password and sign in"}
      </Button>
    </form>
  );
}
