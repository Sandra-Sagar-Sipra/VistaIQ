import { type ReactNode, useEffect, useState } from "react";
import { InteractionType } from "@azure/msal-browser";
import { MsalAuthenticationTemplate } from "@azure/msal-react";
import { Loader2 } from "lucide-react";

import { initializeMsal, loginRequest } from "@/auth/msalConfig";
import { Logo } from "@/components/Logo";

/**
 * Blocks the application until the user is signed in.
 *
 * There is no "Sign in" button anywhere. `InteractionType.Redirect` sends an
 * unauthenticated visitor straight to Microsoft, which is the requirement:
 * open the URL, land on the account picker, authenticate, come back signed
 * in. Multi-factor authentication, where the tenant's Conditional Access
 * policy requires it, is inserted by Microsoft inside that redirect -- there
 * is deliberately no code here for it.
 */

function FullScreenMessage({
  title,
  detail,
  showSpinner = false,
}: {
  title: string;
  detail?: string;
  showSpinner?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo size={56} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {detail ? <p className="max-w-md text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      {showSpinner ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}

function SigningIn() {
  return <FullScreenMessage title="Redirecting to Microsoft sign-in…" showSpinner />;
}

function SignInFailed({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return (
    <FullScreenMessage
      title="Could not sign you in."
      detail={`${message} — if this persists, check that the redirect URI registered in Entra exactly matches this page's address.`}
    />
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // MSAL v3 must be initialised, and the redirect response consumed, before
  // any component asks about accounts. Rendering the template first would
  // race that and can leave a just-signed-in user looking signed out.
  useEffect(() => {
    initializeMsal().then(
      () => setReady(true),
      (err) => setError(err)
    );
  }, []);

  if (error) return <SignInFailed error={error} />;
  if (!ready) return <FullScreenMessage title="Starting…" showSpinner />;

  return (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      authenticationRequest={loginRequest}
      loadingComponent={SigningIn}
      errorComponent={SignInFailed}
    >
      {children}
    </MsalAuthenticationTemplate>
  );
}
