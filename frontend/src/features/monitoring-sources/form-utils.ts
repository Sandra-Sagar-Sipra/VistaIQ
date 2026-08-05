import type { FormMode, MonitoringSourceFormValues } from "@/features/monitoring-sources/schema";
import type {
  Credentials,
  MonitoringSource,
  MonitoringSourceCreatePayload,
  MonitoringSourceUpdatePayload,
} from "@/types/monitoring-source";

export function getDefaultFormValues(source?: MonitoringSource | null): MonitoringSourceFormValues {
  if (!source) {
    return {
      name: "",
      source_type: "monitoring",
      vendor: "",
      base_url: "",
      auth_method: "api_key",
      ingestion_mode: "poll",
      is_enabled: true,
      poll_interval_seconds: "60",
      webhook_secret: "",
      api_key: "",
      username: "",
      password: "",
      token: "",
      client_id: "",
      client_secret: "",
      token_url: "",
    };
  }

  return {
    name: source.name,
    source_type: source.source_type,
    vendor: source.vendor,
    base_url: source.base_url,
    auth_method: source.auth_method,
    ingestion_mode: source.ingestion_mode,
    is_enabled: source.is_enabled,
    poll_interval_seconds: source.poll_interval_seconds ? String(source.poll_interval_seconds) : "",
    webhook_secret: "",
    api_key: "",
    username: "",
    password: "",
    token: "",
    client_id: "",
    client_secret: "",
    token_url: "",
  };
}

function buildCredentials(values: MonitoringSourceFormValues): Credentials | null {
  switch (values.auth_method) {
    case "api_key":
      return values.api_key.trim() ? { api_key: values.api_key.trim() } : null;
    case "basic":
      return values.username.trim() && values.password.trim()
        ? { username: values.username.trim(), password: values.password.trim() }
        : null;
    case "bearer_token":
      return values.token.trim() ? { token: values.token.trim() } : null;
    case "oauth2":
      return values.client_id.trim() && values.client_secret.trim() && values.token_url.trim()
        ? {
            client_id: values.client_id.trim(),
            client_secret: values.client_secret.trim(),
            token_url: values.token_url.trim(),
          }
        : null;
    default:
      return null;
  }
}

export function buildSourcePayload(
  values: MonitoringSourceFormValues,
  mode: FormMode
): MonitoringSourceCreatePayload | MonitoringSourceUpdatePayload {
  const credentials = buildCredentials(values);

  const payload: MonitoringSourceUpdatePayload = {
    name: values.name,
    source_type: values.source_type,
    vendor: values.vendor,
    base_url: values.base_url,
    auth_method: values.auth_method,
    ingestion_mode: values.ingestion_mode,
    is_enabled: values.is_enabled,
    poll_interval_seconds:
      values.ingestion_mode === "poll" ? Number(values.poll_interval_seconds) : null,
  };

  if (credentials) {
    payload.credentials = credentials;
  }

  if (values.ingestion_mode === "webhook" && values.webhook_secret.trim()) {
    payload.webhook_secret = values.webhook_secret.trim();
  }

  return mode === "create" ? (payload as MonitoringSourceCreatePayload) : payload;
}
