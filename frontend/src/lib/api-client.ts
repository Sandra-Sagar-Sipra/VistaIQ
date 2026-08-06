import { acquireApiToken, reauthenticate } from "@/auth/msalConfig";

/**
 * Guards against a burst of parallel 401s each starting its own redirect.
 * The dashboard fires several queries at once, so without this a single
 * expired session would trigger a stampede of navigations.
 */
let reauthInFlight: Promise<void> | null = null;

/**
 * Survives the redirect, so a *second* 401 shortly after re-authenticating
 * does not redirect again.
 *
 * Without this, a backend that rejects every token -- a misconfigured
 * audience, a manifest still on token version 1, a tenant missing from the
 * allowlist -- produces an infinite loop: sign in, 401, clear cache, sign in.
 * The user cannot read the error because the page never stops navigating,
 * and the actual cause is server configuration that signing in again will
 * never fix. Better to surface the error once and let it be diagnosed.
 */
const REAUTH_MARKER = "vistaiq.reauth.attempted-at";
const REAUTH_COOLDOWN_MS = 30_000;

function recentlyAttemptedReauth(): boolean {
  try {
    const raw = window.sessionStorage.getItem(REAUTH_MARKER);
    if (!raw) return false;
    return Date.now() - Number(raw) < REAUTH_COOLDOWN_MS;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Treat that
    // as "already attempted" so a failure here cannot cause a redirect loop.
    return true;
  }
}

function markReauthAttempt(): void {
  try {
    window.sessionStorage.setItem(REAUTH_MARKER, String(Date.now()));
  } catch {
    /* best effort */
  }
}

function handleUnauthorized(): Promise<void> {
  if (recentlyAttemptedReauth()) {
    // Already tried. Let the ApiError propagate so the message reaches the UI.
    return Promise.resolve();
  }

  if (!reauthInFlight) {
    markReauthAttempt();
    reauthInFlight = reauthenticate().finally(() => {
      reauthInFlight = null;
    });
  }
  return reauthInFlight;
}

/** Called once a request succeeds, so a later genuine expiry can redirect. */
function clearReauthMarker(): void {
  try {
    window.sessionStorage.removeItem(REAUTH_MARKER);
  } catch {
    /* best effort */
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const BASE_URL = "/api/v1";

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return `${url.pathname}${url.search}`;
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, headers, ...rest } = options;

  // Every request goes through here, so this is the only place a token needs
  // to be attached. MSAL serves it from cache and refreshes it transparently
  // when it is close to expiring, so calling this per request is cheap.
  const accessToken = await acquireApiToken();

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  // A 401 here means MSAL held a token it believed was valid but the API
  // refused it -- a revoked session, a disabled account, or a token whose
  // signing key rotated. Without this the app would sit on a dead token and
  // every request would fail identically, looking like the app is broken
  // rather than like the user needs to sign in again.
  //
  // A 403 is deliberately NOT treated this way: the user is authenticated
  // and simply lacks permission, so bouncing them through sign-in would
  // change nothing and would hide the real reason.
  if (response.status === 401) {
    await handleUnauthorized();
  }

  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : payload;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : `Request failed with status ${response.status}`,
      detail
    );
  }

  // Proof the session works. Clearing the marker means a genuine expiry later
  // in this session can still trigger a redirect, while a persistently broken
  // configuration stays blocked from looping.
  clearReauthMarker();

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
