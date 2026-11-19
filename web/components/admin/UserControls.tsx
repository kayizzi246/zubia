"use client";

import { Loader2, MailPlus } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteAdmin, setUserRole } from "@/app/admin/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADMIN_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/lib/db/rows";

/**
 * The role dropdown in the users table.
 *
 * `options` is what this admin is allowed to hand out (see assignableRoles).
 * When the person's current role isn't in that list, the dropdown is shown but
 * disabled, so a broker admin can see that someone is a super admin without
 * being able to change it.
 */
export function RoleSelect({
  userId,
  role,
  options,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  options: UserRole[];
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role);

  const locked = isSelf || !options.includes(value);
  const title = isSelf
    ? "You can't change your own role"
    : locked
      ? `Only a super admin can change a ${ROLE_LABELS[value]}'s role`
      : undefined;

  return (
    <Select
      value={value}
      disabled={pending || locked}
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
      <SelectTrigger className="h-10 w-40 bg-white" aria-label="Role" title={title}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
        {/* Keeps the label readable when the role is one we can't assign. */}
        {!options.includes(value) && (
          <SelectItem value={value} disabled>
            {ROLE_LABELS[value]}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

/** Invite a new admin by email. Only rendered for super admins. */
export function InviteAdminDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(inviteAdmin, null);
  const [role, setRole] = useState<UserRole>("works_admin");

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
          <MailPlus /> Invite admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Invite an admin</DialogTitle>
          <DialogDescription>
            We email them a link. They choose their own password, so you never
            have to send one.
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
            <Input
              id="admin-email"
              name="email"
              type="email"
              required
              className="h-11"
              aria-invalid={!!state?.errors?.email}
            />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-role">What can they do?</Label>
            <input type="hidden" name="role" value={role} />
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="admin-role" className="h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          {state && !state.ok && !state.errors && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending} className="h-11">
              {pending ? <Loader2 className="animate-spin" /> : <MailPlus />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
