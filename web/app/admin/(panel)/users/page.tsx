import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { InviteAdminDialog, RoleSelect } from "@/components/admin/UserControls";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { getProfiles } from "@/lib/data/admin";
import {
  ADMIN_ROLES,
  assignableRoles,
  isAdminRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/lib/permissions";

export const metadata: Metadata = { title: "Users & admins" };

export default async function UsersPage() {
  const [me, profiles] = await Promise.all([
    requirePermission("users.view"),
    getProfiles(),
  ]);

  const adminCount = profiles.filter((p) => isAdminRole(p.role)).length;
  const options = assignableRoles(me.role);
  const canInvite = me.can("admins.manage");

  return (
    <>
      <PageHeader
        title="Users & admins"
        description={`${profiles.length} accounts · ${adminCount} ${adminCount === 1 ? "admin" : "admins"}`}
        action={canInvite ? <InviteAdminDialog /> : undefined}
      />

      {/* What each kind of admin can do, in plain words. */}
      <Card className="mb-4 p-4">
        <h2 className="font-display text-sm font-bold text-ink">
          What each kind of admin can do
        </h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-3">
          {ADMIN_ROLES.map((role) => (
            <div key={role} className="rounded-lg bg-muted/50 p-3">
              <dt className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                {ROLE_LABELS[role]}
              </dt>
              <dd className="mt-0.5 text-xs text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="pr-4">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-medium">
                  <span className="flex items-center gap-1.5">
                    {isAdminRole(p.role) && (
                      <ShieldCheck
                        className="size-4 text-primary"
                        aria-label={ROLE_LABELS[p.role]}
                      />
                    )}
                    {p.fullName || "—"}
                    {p.id === me.id && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString("en-UG", {
                    dateStyle: "medium",
                  })}
                </TableCell>
                <TableCell className="pr-4">
                  <RoleSelect
                    userId={p.id}
                    role={p.role}
                    options={options}
                    isSelf={p.id === me.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <p className="mt-3 text-sm text-muted-foreground">
        {canInvite
          ? "You can change anyone's role except your own. Ask another super admin if you need yours changed."
          : "You can move people between User and Agent. Only a super admin can add or change admins."}
      </p>
    </>
  );
}
