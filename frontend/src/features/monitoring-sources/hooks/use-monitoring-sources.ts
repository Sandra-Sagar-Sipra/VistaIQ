import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createMonitoringSource,
  deleteMonitoringSource,
  fetchMonitoringSources,
  syncMonitoringSource,
  testMonitoringSourceConnection,
  updateMonitoringSource,
} from "@/api/monitoring-sources";
import { ApiError } from "@/lib/api-client";
import type {
  MonitoringSourceCreatePayload,
  MonitoringSourceListParams,
  MonitoringSourceUpdatePayload,
} from "@/types/monitoring-source";

export const monitoringSourceKeys = {
  all: ["monitoring-sources"] as const,
  list: (params: MonitoringSourceListParams) => [...monitoringSourceKeys.all, "list", params] as const,
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useMonitoringSourcesQuery(params: MonitoringSourceListParams) {
  return useQuery({
    queryKey: monitoringSourceKeys.list(params),
    queryFn: () => fetchMonitoringSources(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMonitoringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MonitoringSourceCreatePayload) => createMonitoringSource(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringSourceKeys.all });
      toast.success("Monitoring source created");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create monitoring source"));
    },
  });
}

export function useUpdateMonitoringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MonitoringSourceUpdatePayload }) =>
      updateMonitoringSource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringSourceKeys.all });
      toast.success("Monitoring source updated");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to update monitoring source"));
    },
  });
}

export function useDeleteMonitoringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMonitoringSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringSourceKeys.all });
      toast.success("Monitoring source deleted");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to delete monitoring source"));
    },
  });
}

export function useTestMonitoringSourceConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testMonitoringSourceConnection(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: monitoringSourceKeys.all });
      if (result.success) {
        toast.success(result.message || "Connection successful", {
          description: `${result.latency_ms}ms`,
        });
      } else {
        toast.error(result.message || "Connection failed");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to test connection"));
    },
  });
}

export function useSyncMonitoringSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => syncMonitoringSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringSourceKeys.all });
      toast.success("Sync queued");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to queue sync"));
    },
  });
}
