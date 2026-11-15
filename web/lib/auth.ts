import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/supabase/rows";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * The signed-in admin, or a redirect to the login page.
 * Call this at the top of every admin page AND every admin Server Action:
 * hiding a button is not security, this check is.
 */
export async function requireAdmin(): Promise<AdminUser> {
  if (!isSupabaseConfigured()) redirect("/admin/setup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin/login?error=not-admin");

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile.full_name || user.email || "Admin",
    role: profile.role,
  };
}
