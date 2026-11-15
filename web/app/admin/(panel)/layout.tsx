import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/lib/auth";

// Admin pages read the login cookie, so they render per request.
export const instant = false;

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar admin={{ name: admin.name, email: admin.email }} />
        <SidebarInset className="bg-surface">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-white px-4">
            <SidebarTrigger className="size-10" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <span className="text-sm text-muted-foreground">Zubia admin</span>
          </header>
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function AdminLoading() {
  return (
    <div className="flex flex-1">
      <div className="hidden w-64 bg-primary-dark md:block" />
      <div className="flex-1 space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
