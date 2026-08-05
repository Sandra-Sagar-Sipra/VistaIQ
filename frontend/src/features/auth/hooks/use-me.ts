import { useQuery } from "@tanstack/react-query";

import { fetchMe } from "@/api/me";

/**
 * The signed-in user as VistaIQ knows them.
 *
 * Distinct from MSAL's account, which is what *Microsoft* knows. This one
 * round-trips the API, so a successful result also proves the token was
 * accepted by the backend -- which makes it the end-to-end check that
 * sign-in genuinely works, not just that a redirect completed.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    // Identity rarely changes within a session, and this fires on every page.
    staleTime: 5 * 60_000,
    retry: false,
  });
}
