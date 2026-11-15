import { BadgeCheck, Clock, Home, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { ReviewButtons } from "@/components/admin/ListingActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/data/admin";
import { formatListingPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const kpis = [
    { label: "Total listings", value: stats.total, note: `${stats.byStatus.approved} live on the site`, icon: Home },
    { label: "Waiting for review", value: stats.byStatus.pending, note: "Approve or reject below", icon: Clock, highlight: stats.byStatus.pending > 0 },
    { label: "Featured", value: stats.featured, note: `${stats.titleChecked} title checked`, icon: Star },
    { label: "Users", value: stats.users, note: `${stats.agents} agents`, icon: Users },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="What's happening on Zubia today." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={kpi.highlight ? "border-sun ring-2 ring-sun/30" : ""}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.note}</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <kpi.icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts stats={stats} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-display font-bold">Waiting for review</CardTitle>
          <CardDescription>New listings stay hidden from the public until you approve them.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.pending.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <BadgeCheck className="size-5 text-primary" />
              All caught up. Nothing to review.
            </p>
          ) : (
            <ul className="divide-y">
              {stats.pending.map((listing) => (
                <li key={listing.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/listings/${listing.id}`} className="font-semibold hover:underline">
                      {listing.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatListingPrice(listing)} · {listing.area}, {listing.district}
                    </p>
                  </div>
                  <ReviewButtons id={listing.id} />
                </li>
              ))}
            </ul>
          )}
          {stats.byStatus.pending > stats.pending.length && (
            <Link href="/admin/listings?status=pending" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
              See all {stats.byStatus.pending} pending
            </Link>
          )}
        </CardContent>
      </Card>
    </>
  );
}
