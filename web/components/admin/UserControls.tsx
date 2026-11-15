"use client";

import { Loader2, ShieldPlus } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createAdmin, setUserRole } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/lib/supabase/rows";

const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  agent: "Agent",
  admin: "Admin",
};

export function RoleSelect({ userId, role, isSelf }: { userId: string; role: UserRole; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role);

  return (
    <Select
      value={value}
      disabled={pending || isSelf}
      onValueChange={(next) => {
        const previous = value;
        setValue(next as UserRole);
        start(async () => {
          const result = await setUserRole(userId, next as UserRole);
          if (result.ok) toast.success(result.message);
          else {
            setValue(previous);
            toast.error(result.message);
          }
        });
      }}
    >
      <SelectTrigger className="h-10 w-32 bg-white" aria-label="Role">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AddAdminDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAdmin, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect -- close after success
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11">
          <ShieldPlus /> Add admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Add an admin</DialogTitle>
          <DialogDescription>
            Creates a new account with full admin access. Send them the password privately (not by email) and ask
            them to change it.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            startTransition(() => action(data));
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" name="email" type="email" required className="h-11" aria-invalid={!!state?.errors?.email} />
            {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Temporary password</Label>
            <Input
              id="admin-password"
              name="password"
              type="text"
              autoComplete="off"
              required
              minLength={10}
              className="h-11 font-mono"
              aria-invalid={!!state?.errors?.password}
            />
            <p className={`text-xs ${state?.errors?.password ? "text-destructive" : "text-muted-foreground"}`}>
              {state?.errors?.password ?? "At least 10 characters."}
            </p>
          </div>
          {state && !state.ok && !state.errors && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="h-11">
              {pending ? <Loader2 className="animate-spin" /> : <ShieldPlus />}
              Create admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
