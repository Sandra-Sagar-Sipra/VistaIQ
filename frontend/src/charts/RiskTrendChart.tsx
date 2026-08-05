import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useRiskTrend } from "@/hooks/use-dashboard";
import type { RiskTrendPoint } from "@/types/dashboard";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function RiskTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as RiskTrendPoint;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-popover">
      <p className="font-medium text-popover-foreground">{formatDate(point.date)}</p>
      <p className="text-muted-foreground">Risk score: {point.risk_score}</p>
    </div>
  );
}

export function RiskTrendCard() {
  const { data, isLoading, isError, refetch } = useRiskTrend();

  return (
    <DashboardCard
      title="Risk Trend"
      description="Composite operational risk over the last 14 days"
      icon={Activity}
      className="lg:col-span-8"
    >
      {isLoading ? (
        <DashboardSkeleton variant="chart" />
      ) : isError ? (
        <DashboardErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="riskTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 6" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<RiskTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
            <Area
              type="monotone"
              dataKey="risk_score"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#riskTrendGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </DashboardCard>
  );
}
