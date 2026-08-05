# Microsoft Entra ID SSO — design

Date: 2026-08-05
Branch: `feature/SSO`
Covers: WBS epic E03 (tasks 3.1–3.4) and task 9.2
Status: design agreed, implementation not started

## Goal

A user visiting VistaIQ is redirected to Microsoft automatically, picks an
account, authenticates (including 2FA where the tenant requires it), and
returns signed in. Every API call thereafter carries a token the backend
verifies. No local accounts, no passwords stored by VistaIQ.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Frontend-driven MSAL React; backend only *validates* tokens | PRD tasks 3.1 + 9.2. A backend-driven flow was considered and rejected. |
| D2 | Public client with PKCE, **no client secret** | An SPA ships its code to the browser and cannot hold a secret. |
| D3 | Multi-tenant registration **plus** a backend tenant allowlist | Keeps the option of onboarding other orgs while closing the hole that multi-tenant would otherwise open (see Security note). |
| D4 | Single app registration exposing its own API scope | Fewer moving parts than a separate SPA/API pair, adequate for release one. |
| D5 | Auth gate wraps the whole app, no route-level protection | `App.tsx` renders one page; react-router is not a dependency. |
| D6 | Local dev bypass flag (WBS 3.4) | Nobody is blocked on tenant access. Refuses to start outside development. |

### Security note on D3

The app registration is multi-tenant, so Microsoft will authenticate users
from any organisation in the world. VistaIQ has **no tenant column** in
either datastore and **no RBAC** in release one, so every user who passes
authentication sees all data. The `ALLOWED_TENANT_IDS` allowlist is
therefore the only access boundary that exists. It is checked against the
token's `tid` claim before any signature verification or network call.

Adding a tenant is an env-var change. It should be a deliberate act.

## Configuration

Entra app registration (client `42244fb9-a3a3-4277-b4e1-adc262981e79`,
tenant `11e9581a-d755-4988-86ad-bccbfd72527b`):

- Platform: **Single-page application**, redirect URI `http://localhost:5173`
  (not "Web" — that would force a client secret and forbid PKCE)
- Supported account types: any organizational directory (multi-tenant)
- Expose an API: `api://<client-id>` with scope `access_as_user`
- API permissions: that same scope, admin consent granted
- Manifest: `requestedAccessTokenVersion: 2`, so the issuer is
  `login.microsoftonline.com/{tid}/v2.0` rather than the v1 `sts.windows.net`

Settings live in `.env` (backend) and `frontend/.env`, both gitignored, with
committed `.env.example` counterparts.

## Backend design

### Token validation — `app/auth/jwt.py`

Order matters:

1. Read claims **without trusting them** to learn the token's `tid`.
2. Reject immediately if `tid` is not in `ALLOWED_TENANT_IDS`. Doing this
   first means an unknown tenant never causes an outbound network call.
3. Fetch that tenant's public signing keys from Microsoft's JWKS endpoint,
   cached in-process (keys rotate rarely; per-request fetches would be slow
   and rate-limited).
4. Verify cryptographically: signature, `iss` equals
   `https://login.microsoftonline.com/{tid}/v2.0`, `aud` equals the client
   ID, and expiry.

Step 4 is the security boundary. Any failure returns 401 in the standard
error shape from `app/core/exceptions.py`.

### Dependencies — `app/auth/dependencies.py`

- `get_current_claims` — validated claims, no database access
- `get_current_user` — the `app_user` row, provisioning on first sight

### User provisioning — WBS 3.2

First valid token bearing an unseen `oid` creates an `app_user` row from the
claims. Every sign-in updates `last_login_at`. Two simultaneous first
sign-ins must not create duplicates: the unique constraint on
`entra_object_id` decides the race and the resulting `IntegrityError` is
caught. Do not check-then-insert.

### New pieces

- `app/models/user.py` and an Alembic migration for `app_user` (none exists)
- `GET /api/v1/me` (WBS 3.3)
- Config: `entra_client_id`, `allowed_tenant_ids`, `auth_bypass_enabled`,
  `auth_bypass_email`

## Frontend design

`frontend/` already contains a working Monitoring Sources UI (React 18, TS,
Vite, Tailwind, shadcn/ui, TanStack Query). SSO plugs into it; it is not a
new app.

- **`src/auth/msalConfig.ts`** — creates and exports a module-scope
  `PublicClientApplication`. It must be module-scope because
  `src/lib/api-client.ts` is a plain module, not a component, and cannot use
  `useMsal()`. The same instance is passed to `MsalProvider`.
- **`src/main.tsx`** — wrap the existing provider tree in `MsalProvider` and
  `MsalAuthenticationTemplate` with `InteractionType.Redirect`, so an
  unauthenticated visitor is redirected before any UI paints.
- **`src/lib/api-client.ts`** — in `request()`, the single choke point for
  all four verbs, call `acquireTokenSilent` and attach
  `Authorization: Bearer …`. On `InteractionRequiredAuthError`, fall back to
  a redirect.
- Login request uses `prompt: 'select_account'` (without it Microsoft
  silently reuses the existing session and users cannot switch accounts) and
  scope `api://<client-id>/access_as_user`.

### Scope correctness

Requesting a Microsoft Graph scope instead of the custom API scope yields a
token addressed to Graph, which the backend correctly rejects. The symptom
is a 401 wall that looks like broken auth code but is configuration.

### 2FA

No code. MFA is enforced by Conditional Access policy in the tenant; when
required, Microsoft inserts the step inside the redirect.

### No CORS

`vite.config.ts` proxies `/api` to `127.0.0.1:8000` and `api-client.ts` uses
the relative path `/api/v1`, so the API is same-origin in development.

### MSAL v5 notes

The installed version is `@azure/msal-browser` 5.x, not the 3.x most
tutorials target. Two options widely quoted in guides no longer exist and are
compile errors if copied in:

- `auth.navigateToLoginRequestUrl` — removed
- `cache.storeAuthStateInCookie` — removed (see `cacheRetentionDays`)

`initialize()` must be awaited before any other MSAL call, and
`handleRedirectPromise()` must run to consume the authorization code Microsoft
appends on return. Skipping the latter leaves a user who has just signed in
appearing signed out. Both happen once in `initializeMsal()`.

`@types/node` was missing from the frontend, so `vite.config.ts` failed to
type-check and `npm run build` was broken before this work. Added.

## Sequencing hazard

`MonitoringSourcesPage` calls `GET /api/v1/sources` with no token today.
Requiring auth on that route before the frontend sends tokens breaks a
working screen. Phases below keep `main` green throughout.

## Phases

1. **Backend, unenforced.** ✅ Done. Config, `app_user` model and migration,
   JWKS validation, dependencies, `GET /me`, dev bypass. Auth applied to
   `/me` only. 44 tests, verified against the live database.
2. **Frontend auth.** ✅ Done. MSAL config, provider, redirect gate, token
   attachment in `api-client.ts`, user menu. Verified: visiting the app
   redirects to Microsoft with no console errors. `/sources` still
   unauthenticated, so the UI keeps working while login is proven.
3. **Enforce.** Apply `get_current_user` to `/sources`. Both halves now
   exist, so nothing breaks. Blocked only on a human completing a real
   sign-in to confirm the token round-trip.
4. **Harden.** 401 handling surfaced through `sonner`, silent-refresh check,
   frontend tests.

## Out of scope

RBAC and permissions (`app/auth/permissions.py` stays empty — WBS 0.10),
tenant isolation of data, local password accounts (`app/auth/password.py`
stays empty — the PRD specifies no local accounts), token revocation lists,
and refresh-token persistence beyond MSAL's own cache.
