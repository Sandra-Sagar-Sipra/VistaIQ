import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createApplication,
  deleteApplication,
  fetchApplication,
  fetchApplications,
  updateApplication,
} from "@/api/applications";
import type {
  ApplicationCreatePayload,
  ApplicationListParams,
  ApplicationUpdatePayload,
} from "@/types/applications";

export const APPLICATIONS_QUERY_KEY = "applications";

export function useApplicationsQuery(params: ApplicationListParams) {
  return useQuery({
    queryKey: [APPLICATIONS_QUERY_KEY, params],
    queryFn: () => fetchApplications(params),
  });
}

export function useApplicationQuery(id: string) {
  return useQuery({
    queryKey: [APPLICATIONS_QUERY_KEY, id],
    queryFn: () => fetchApplication(id),
    enabled: !!id,
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplicationCreatePayload) => createApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
    },
  });
}

export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationUpdatePayload }) =>
      updateApplication(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY, id] });
    },
  });
}

export function useDeleteApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_QUERY_KEY] });
      queryClient.removeQueries({ queryKey: [APPLICATIONS_QUERY_KEY, id] });
    },
  });
}
