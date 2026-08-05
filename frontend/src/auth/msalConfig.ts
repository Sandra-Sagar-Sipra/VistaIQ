import {
  type AccountInfo,
  type Configuration,
  InteractionRequiredAuthError,
  LogLevel,
  PublicClientApplication,
  type RedirectRequest,
  type SilentRequest,
} from "@azure/msal-browser";

/**
 * MSAL setup for VistaIQ.
 *
 * The `PublicClientApplication` is created here at module scope rather than
 * inside a React component, because `src/lib/api-client.ts` is a plain module
 * and cannot call the `useMsal()` hook. Both the React tree and the API layer
 * import this one instance, so they share a single token cache. Creating a
 * second instance elsewhere would produce a client that appears signed in to
 * components but has no token to attach to requests.
 *
 * There is no client secret. A single-page application ships its code to the
 * browser and cannot keep one, so MSAL uses PKCE instead.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Failing at startup with a clear message beats an opaque AADSTS error
    // after a redirect to Microsoft.
    throw new Error(
      `Missing ${name}. Copy frontend/.env.example to frontend/.env and fill it in.`
    );
  }
  return value;
}

const clientId = required("VITE_ENTRA_CLIENT_ID", import.meta.env.VITE_ENTRA_CLIENT_ID);
const authority = required("VITE_ENTRA_AUTHORITY", import.meta.env.VITE_ENTRA_AUTHORITY);
const redirectUri = required("VITE_ENTRA_REDIRECT_URI", import.meta.env.VITE_ENTRA_REDIRECT_URI);

/** The custom scope exposed by the app registration under "Expose an API". */
export const API_SCOPE = required("VITE_API_SCOPE", import.meta.env.VITE_API_SCOPE);

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    // The multi-tenant "organizations" authority issues tokens whose issuer
    // names the user's own tenant, which does not match the authority URL.
    // Without this, MSAL rejects its own valid tokens.
    knownAuthorities: ["login.microsoftonline.com"],
  },
  cache: {
    // sessionStorage, not localStorage: closing the tab ends the session.
    // localStorage would persist tokens across restarts and widen the blast
    // radius of any cross-site scripting bug into a durable session hijack.
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error("[msal]", message);
        else if (level === LogLevel.Warning) console.warn("[msal]", message);
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Sign-in request.
 *
 * `prompt: "select_account"` forces the account picker. Without it Microsoft
 * silently reuses whichever account the browser is already signed into, and
 * a user with both work and personal accounts cannot switch.
 */
export const loginRequest: RedirectRequest = {
  scopes: [API_SCOPE],
  prompt: "select_account",
};

/** Token request for API calls. No `prompt` -- this must stay silent. */
export const tokenRequest: Omit<SilentRequest, "account"> = {
  scopes: [API_SCOPE],
};

let initialized: Promise<void> | null = null;

/**
 * Initialise MSAL exactly once.
 *
 * MSAL v3 requires `initialize()` before any other call, and
 * `handleRedirectPromise()` must run to consume the authorization code that
 * Microsoft appends to the URL on return. Skipping the latter leaves the user
 * apparently signed out immediately after signing in.
 */
export function initializeMsal(): Promise<void> {
  if (!initialized) {
    initialized = msalInstance
      .initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((result) => {
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        } else if (!msalInstance.getActiveAccount()) {
          const [first] = msalInstance.getAllAccounts();
          if (first) msalInstance.setActiveAccount(first);
        }
      });
  }
  return initialized;
}

export function getActiveAccount(): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
}

/**
 * Return an access token for the VistaIQ API.
 *
 * Served from MSAL's cache and refreshed transparently when near expiry, so
 * this is cheap to call before every request. When the session has genuinely
 * expired, MSAL raises `InteractionRequiredAuthError` and the only way
 * forward is a full redirect -- returning null there would surface as a
 * silent 401 loop instead of a re-login.
 */
export async function acquireApiToken(): Promise<string> {
  await initializeMsal();

  const account = getActiveAccount();
  if (!account) {
    await msalInstance.loginRedirect(loginRequest);
    // loginRedirect navigates away; this never resolves in practice.
    throw new Error("Redirecting to sign in");
  }

  try {
    const result = await msalInstance.acquireTokenSilent({ ...tokenRequest, account });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ ...tokenRequest, account });
      throw new Error("Redirecting to sign in");
    }
    throw error;
  }
}

/**
 * Force a fresh sign-in after the API rejected a token MSAL thought was good.
 *
 * The cached token is cleared first. Skipping that would let MSAL hand back
 * the same rejected token from cache and produce an immediate redirect loop.
 */
export async function reauthenticate(): Promise<void> {
  await initializeMsal();
  const account = getActiveAccount();

  if (account) {
    try {
      await msalInstance.clearCache({ account });
    } catch {
      // Clearing is best effort; the redirect below is what matters.
    }
  }

  await msalInstance.loginRedirect(loginRequest);
}

export async function signOut(): Promise<void> {
  await initializeMsal();
  const account = getActiveAccount();
  await msalInstance.logoutRedirect({ account: account ?? undefined });
}
