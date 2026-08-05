import { useQuery } from "@tanstack/react-query";

import {
  fetchActivityFeed,
  fetchApplicationHealth,
  fetchDashboardSummary,
  fetchRecentIncidents,
  fetchSeverityBreakdown,
  fetchSourceStatus,
} from "@/api/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  applicationHealth: () => [...dashboardKeys.all, "application-health"] as const,
  severity: () => [...dashboardKeys.all, "severity"] as const,
  incidents: () => [...dashboardKeys.all, "incidents"] as const,
  activity: () => [...dashboardKeys.all, "activity"] as const,
  sourceStatus: () => [...dashboardKeys.all, "source-status"] as const,
};

const REFRESH_INTERVAL_MS = 60_000;

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboardSummary,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useApplicationHealth() {
  return useQuery({
    queryKey: dashboardKeys.applicationHealth(),
    queryFn: fetchApplicationHealth,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useSeverityBreakdown() {
  return useQuery({
    queryKey: dashboardKeys.severity(),
    queryFn: fetchSeverityBreakdown,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useRecentIncidents() {
  return useQuery({
    queryKey: dashboardKeys.incidents(),
    queryFn: fetchRecentIncidents,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: fetchActivityFeed,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useSourceStatus() {
  return useQuery({
    queryKey: dashboardKeys.sourceStatus(),
    queryFn: fetchSourceStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}
