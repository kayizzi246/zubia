"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminStats } from "@/lib/data/admin";

const districtConfig = {
  buy: { label: "For sale", color: "var(--chart-1)" },
  rent: { label: "For rent", color: "var(--chart-2)" },
  land: { label: "Land", color: "var(--chart-3)" },
} satisfies ChartConfig;

const statusConfig = {
  count: { label: "Listings" },
  approved: { label: "Approved", color: "var(--chart-1)" },
  pending: { label: "Pending", color: "var(--chart-2)" },
  rejected: { label: "Rejected", color: "var(--destructive)" },
  archived: { label: "Archived", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function DashboardCharts({ stats }: { stats: AdminStats }) {
  const statusData = (Object.keys(stats.byStatus) as (keyof typeof stats.byStatus)[])
    .filter((s) => stats.byStatus[s] > 0)
    .map((s) => ({ status: s, count: stats.byStatus[s], fill: `var(--color-${s})` }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-display font-bold">Listings by district</CardTitle>
          <CardDescription>All statuses, split by type</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={districtConfig} className="h-72 w-full">
            <BarChart data={stats.byDistrict} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="district" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="buy" stackId="a" fill="var(--color-buy)" />
              <Bar dataKey="rent" stackId="a" fill="var(--color-rent)" />
              <Bar dataKey="land" stackId="a" fill="var(--color-land)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display font-bold">Review status</CardTitle>
          <CardDescription>Where every listing stands</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <ChartContainer config={statusConfig} className="mx-auto aspect-square h-72">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={4} />
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
