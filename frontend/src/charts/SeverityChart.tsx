import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useSeverityBreakdown } from "@/hooks/use-dashboard";
import { SEVERITY_META } from "@/lib/status-colors";
import type { SeverityBreakdownItem } from "@/types/dashboard";

function SeverityTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as SeverityBreakdownItem;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{SEVERITY_META[item.severity].label}</p>
      <p className="text-muted-foreground">{item.count} alerts</p>
    </div>
  );
}

export function SeverityChart() {
  const { data, isLoading, isError, refetch } = useSeverityBreakdown();
  const total = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alerts by Severity</CardTitle>
        <CardDescription>Current open alert distribution</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <DashboardSkeleton variant="chart" />
        ) : isError ? (
          <DashboardErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 || total === 0 ? (
          <DashboardEmptyState />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {data.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_META[entry.severity].hex} />
                  ))}
                </Pie>
                <Tooltip content={<SeverityTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {data.map((entry) => (
                <div key={entry.severity} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SEVERITY_META[entry.severity].hex }}
                    />
                    {SEVERITY_META[entry.severity].label}
                  </span>
                  <span className="font-medium text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
