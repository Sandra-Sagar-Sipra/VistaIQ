import { AlertOctagon, Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useApplicationHealth } from "@/hooks/use-dashboard";
import { HEALTH_BAND_TEXT_CLASS, TREND_SENTIMENT_CLASS, healthScoreBand } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { Trend } from "@/types/dashboard";

const TREND_ICON: Record<Trend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const RISK_COUNT = 5;

export function RiskApplicationsCard() {
  const { data, isLoading, isError, refetch } = useApplicationHealth();
  const atRisk = data ? [...data].sort((a, b) => a.health_score - b.health_score).slice(0, RISK_COUNT) : [];

  return (
    <DashboardCard
      title="Applications at Risk"
      description="Lowest health scores across your portfolio"
      icon={AlertOctagon}
      className="lg:col-span-5"
    >
      {isLoading ? (
        <DashboardSkeleton variant="list" rows={RISK_COUNT} />
      ) : isError ? (
        <DashboardErrorState onRetry={() => refetch()} />
      ) : atRisk.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <ul className="divide-y divide-border/60">
          {atRisk.map((app) => {
            const TrendIcon = TREND_ICON[app.trend.direction];
            return (
              <li
                key={app.application}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{app.application}</p>
                  <p className="text-xs text-muted-foreground">{app.critical_alerts} critical alerts</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      HEALTH_BAND_TEXT_CLASS[healthScoreBand(app.health_score)]
                    )}
                  >
                    {app.health_score}
                  </span>
                  <TrendIcon className={cn("h-3.5 w-3.5", TREND_SENTIMENT_CLASS[app.trend.sentiment])} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
