/// <reference types="vite/client" />

/**
 * Typed access to the VITE_ variables in frontend/.env.
 *
 * Declaring them means a typo like VITE_API_SCOP is a compile error rather
 * than an `undefined` that only shows up as an authentication failure after
 * a redirect to Microsoft.
 */
interface ImportMetaEnv {
  readonly VITE_ENTRA_CLIENT_ID: string;
  readonly VITE_ENTRA_AUTHORITY: string;
  readonly VITE_ENTRA_REDIRECT_URI: string;
  readonly VITE_API_SCOPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
