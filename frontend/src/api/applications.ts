import { apiClient } from "@/lib/api-client";
import type {
  Application,
  ApplicationCreatePayload,
  ApplicationListParams,
  ApplicationListResponse,
  ApplicationUpdatePayload,
} from "@/types/applications";

const BASE_PATH = "/applications";

export function fetchApplications(params: ApplicationListParams) {
  return apiClient.get<ApplicationListResponse>(BASE_PATH, {
    limit: params.limit,
    offset: params.offset,
    search: params.search,
  });
}

export function fetchApplication(id: string) {
  return apiClient.get<Application>(`${BASE_PATH}/${id}`);
}

export function createApplication(payload: ApplicationCreatePayload) {
  return apiClient.post<Application>(BASE_PATH, payload);
}

export function updateApplication(id: string, payload: ApplicationUpdatePayload) {
  return apiClient.patch<Application>(`${BASE_PATH}/${id}`, payload);
}

export function deleteApplication(id: string) {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
}
