import type { AuthMethod, IngestionMode, SourceType } from "@/types/monitoring-source";

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "monitoring", label: "Monitoring" },
  { value: "security", label: "Security" },
  { value: "devops", label: "DevOps" },
  { value: "cloud", label: "Cloud" },
];

export const AUTH_METHOD_OPTIONS: { value: AuthMethod; label: string }[] = [
  { value: "api_key", label: "API Key" },
  { value: "oauth2", label: "OAuth2" },
  { value: "basic", label: "Basic" },
  { value: "bearer_token", label: "Bearer Token" },
];

export const INGESTION_MODE_OPTIONS: { value: IngestionMode; label: string }[] = [
  { value: "poll", label: "Poll" },
  { value: "webhook", label: "Webhook" },
];

export const VENDOR_SUGGESTIONS = [
  "veracode",
  "github",
  "dependabot",
  "dynatrace",
  "datadog",
  "cloudwatch",
  "newrelic",
];

export const CONNECTION_STATUS_META: Record<
  string,
  { label: string; variant: "success" | "destructive" | "secondary" }
> = {
  connected: { label: "Connected", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  unknown: { label: "Unknown", variant: "secondary" },
};
