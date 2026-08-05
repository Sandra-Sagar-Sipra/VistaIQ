import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      // VistaIQ is a connectivity-monitoring dashboard: a failed request to our
      // own backend should always surface as an error, not be masked behind
      // the browser's coarse (and often unreliable) online/offline guess.
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
    },
  },
});
