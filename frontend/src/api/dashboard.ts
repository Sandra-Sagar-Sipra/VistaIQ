import { apiClient } from "@/lib/api-client";
import type {
  ActivityEvent,
  ApplicationHealthItem,
  DashboardSummary,
  RecentIncident,
  SeverityBreakdownItem,
  SourceStatusItem,
} from "@/types/dashboard";

const BASE_PATH = "/dashboard";

export function fetchDashboardSummary() {
  return apiClient.get<DashboardSummary>(`${BASE_PATH}/summary`);
}

export function fetchApplicationHealth() {
  return apiClient.get<ApplicationHealthItem[]>(`${BASE_PATH}/application-health`);
}

export function fetchSeverityBreakdown() {
  return apiClient.get<SeverityBreakdownItem[]>(`${BASE_PATH}/severity`);
}

export function fetchRecentIncidents() {
  return apiClient.get<RecentIncident[]>(`${BASE_PATH}/incidents`);
}

export function fetchActivityFeed() {
  return apiClient.get<ActivityEvent[]>(`${BASE_PATH}/activity`);
}

export function fetchSourceStatus() {
  return apiClient.get<SourceStatusItem[]>(`${BASE_PATH}/source-status`);
}
