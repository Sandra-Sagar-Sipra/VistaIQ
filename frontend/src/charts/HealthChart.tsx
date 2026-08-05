import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useApplicationHealth } from "@/hooks/use-dashboard";
import { HEALTH_BAND_HEX, healthScoreBand } from "@/lib/status-colors";
import type { ApplicationHealthItem } from "@/types/dashboard";

function HealthTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ApplicationHealthItem;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{item.application}</p>
      <p className="text-muted-foreground">Health score: {item.health_score}</p>
      <p className="text-muted-foreground">{item.critical_alerts} critical alerts</p>
    </div>
  );
}

export function HealthChart() {
  const { data, isLoading, isError, refetch } = useApplicationHealth();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Application Health Overview</CardTitle>
        <CardDescription>Composite health score by application</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <DashboardSkeleton variant="chart" />
        ) : isError ? (
          <DashboardErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="application"
                width={110}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <Tooltip content={<HealthTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="health_score" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((entry) => (
                  <Cell key={entry.application} fill={HEALTH_BAND_HEX[healthScoreBand(entry.health_score)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
