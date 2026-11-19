"use client";

import { ExternalLink, Home, Inbox, LayoutDashboard, LogOut, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ZubiaMark } from "@/components/brand/ZubiaLogo";
import { ROLE_LABELS, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/lib/db/rows";

// Each link names the permission it needs; the sidebar hides the ones this
// admin can't use. The pages check again on the server.
const NAV: { href: string; label: string; icon: typeof Home; needs: Permission }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, needs: "listings.view" },
  { href: "/admin/listings", label: "Listings", icon: Home, needs: "listings.view" },
  { href: "/admin/listings/new", label: "Add listing", icon: Plus, needs: "listings.manage" },
  { href: "/admin/messages", label: "Messages", icon: Inbox, needs: "messages.manage" },
  { href: "/admin/users", label: "Users & admins", icon: Users, needs: "users.view" },
];

interface AdminSidebarProps {
  admin: { name: string; email: string; role: UserRole; allowed: Permission[] };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => admin.allowed.includes(item.needs));
  // Most specific match wins, so "Add listing" doesn't also light up "Listings".
  const active = nav
    .map((n) => n.href)
    .filter((href) => pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")))
    .sort((a, b) => b.length - a.length)[0];

  const initials = admin.name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white">
                  <ZubiaMark className="size-6" />
                </span>
                <span className="font-display text-xl font-bold text-white">Zubia</span>
                <span className="ml-auto rounded bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-sidebar-primary-foreground">
                  {ROLE_LABELS[admin.role].replace(" admin", "")}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active === item.href}
                    tooltip={item.label}
                    className="h-10 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Website</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View public site" className="h-10">
                  <Link href="/" target="_blank">
                    <ExternalLink />
                    <span>View public site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg p-2 group-data-[collapsible=icon]:p-0">
              <Avatar className="size-8">
                <AvatarFallback className="bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                  {initials || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold text-white">{admin.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{admin.email}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip="Sign out" className="h-10">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
