import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { AddAdminDialog, RoleSelect } from "@/components/admin/UserControls";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { getProfiles } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Users & admins" };

export default async function UsersPage() {
  const [me, profiles] = await Promise.all([requireAdmin(), getProfiles()]);
  const adminCount = profiles.filter((p) => p.role === "admin").length;

  return (
    <>
      <PageHeader
        title="Users & admins"
        description={`${profiles.length} accounts · ${adminCount} ${adminCount === 1 ? "admin" : "admins"}`}
        action={<AddAdminDialog />}
      />

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
                    {p.role === "admin" && <ShieldCheck className="size-4 text-primary" aria-label="Admin" />}
                    {p.full_name || "—"}
                    {p.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
                  </span>
                </TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("en-UG", { dateStyle: "medium" })}
                </TableCell>
                <TableCell className="pr-4">
                  <RoleSelect userId={p.id} role={p.role} isSelf={p.id === me.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 text-sm text-muted-foreground">
        Agents can list properties for clients. Admins can do everything on this page. You can&apos;t change your own role.
      </p>
    </>
  );
}
