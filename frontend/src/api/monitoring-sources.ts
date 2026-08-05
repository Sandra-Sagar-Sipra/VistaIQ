import { apiClient } from "@/lib/api-client";
import type {
  MonitoringSource,
  MonitoringSourceCreatePayload,
  MonitoringSourceListParams,
  MonitoringSourceListResponse,
  MonitoringSourceUpdatePayload,
  SyncTriggerResponse,
  TestConnectionResponse,
} from "@/types/monitoring-source";

const BASE_PATH = "/sources";

export function fetchMonitoringSources(params: MonitoringSourceListParams) {
  return apiClient.get<MonitoringSourceListResponse>(BASE_PATH, {
    limit: params.limit,
    offset: params.offset,
    search: params.search,
    vendor: params.vendor,
    source_type: params.source_type,
    ingestion_mode: params.ingestion_mode,
    is_enabled: params.is_enabled,
  });
}

export function fetchMonitoringSource(id: string) {
  return apiClient.get<MonitoringSource>(`${BASE_PATH}/${id}`);
}

export function createMonitoringSource(payload: MonitoringSourceCreatePayload) {
  return apiClient.post<MonitoringSource>(BASE_PATH, payload);
}

export function updateMonitoringSource(id: string, payload: MonitoringSourceUpdatePayload) {
  return apiClient.patch<MonitoringSource>(`${BASE_PATH}/${id}`, payload);
}

export function deleteMonitoringSource(id: string) {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
}

export function testMonitoringSourceConnection(id: string) {
  return apiClient.post<TestConnectionResponse>(`${BASE_PATH}/${id}/test-connection`);
}

export function syncMonitoringSource(id: string) {
  return apiClient.post<SyncTriggerResponse>(`${BASE_PATH}/${id}/sync`);
}
