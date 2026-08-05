import { useCallback } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { useRegisterTopbarRefresh } from "@/components/layout/TopbarActionsContext";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  dashboardKeys,
  useActivityFeed,
  useApplicationHealth,
  useDashboardSummary,
  useRecentIncidents,
  useRiskTrend,
  useSeverityBreakdown,
  useSourceStatus,
} from "@/hooks/use-dashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(displayName: string | null | undefined, email: string) {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0];
  return email.split("@")[0];
}

export function DashboardHeader() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  const isFetching = useIsFetching({ queryKey: dashboardKeys.all }) > 0;

  const summary = useDashboardSummary();
  const health = useApplicationHealth();
  const severity = useSeverityBreakdown();
  const incidents = useRecentIncidents();
  const activity = useActivityFeed();
  const sources = useSourceStatus();
  const riskTrend = useRiskTrend();

  const lastUpdated = Math.max(
    summary.dataUpdatedAt,
    health.dataUpdatedAt,
    severity.dataUpdatedAt,
    incidents.dataUpdatedAt,
    activity.dataUpdatedAt,
    sources.dataUpdatedAt,
    riskTrend.dataUpdatedAt
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }, [queryClient]);

  useRegisterTopbarRefresh({
    onRefresh: handleRefresh,
    isRefreshing: isFetching,
    lastUpdated: lastUpdated > 0 ? lastUpdated : null,
  });

  const title = me
    ? `${getGreeting()}, ${firstName(me.display_name, me.email)}`
    : "Operational Overview";

  return (
    <div className="px-6 pb-2 pt-8 lg:px-8">
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        Monitor application health, security posture, and operational risk across your enterprise.
      </p>
    </div>
  );
}
