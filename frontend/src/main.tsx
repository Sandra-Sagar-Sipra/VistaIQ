import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { App } from "@/App";
import { AuthGate } from "@/auth/AuthGate";
import { msalInstance } from "@/auth/msalConfig";
import { queryClient } from "@/lib/query-client";

import "@fontsource-variable/inter";
import "@/index.css";

// MsalProvider wraps everything so any component can read auth state.
// AuthGate sits inside it and blocks its children until sign-in completes,
// which means no data query can fire before a token exists -- otherwise the
// first render would issue requests that fail with 401 and populate the
// query cache with errors.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </AuthGate>
    </MsalProvider>
  </StrictMode>
);
