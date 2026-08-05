export const SOURCE_TYPES = ["monitoring", "security", "devops", "cloud"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const AUTH_METHODS = ["api_key", "oauth2", "basic", "bearer_token"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export const INGESTION_MODES = ["poll", "webhook"] as const;
export type IngestionMode = (typeof INGESTION_MODES)[number];

export type ConnectionStatus = "unknown" | "connected" | "failed";

export interface ApiKeyCredentials {
  api_key: string;
}

export interface BasicCredentials {
  username: string;
  password: string;
}

export interface BearerTokenCredentials {
  token: string;
}

export interface OAuth2Credentials {
  client_id: string;
  client_secret: string;
  token_url: string;
}

export type Credentials =
  | ApiKeyCredentials
  | BasicCredentials
  | BearerTokenCredentials
  | OAuth2Credentials;

export interface MonitoringSource {
  id: string;
  name: string;
  source_type: SourceType;
  vendor: string;
  base_url: string;
  auth_method: AuthMethod;
  ingestion_mode: IngestionMode;
  poll_interval_seconds: number | null;
  connection_status: ConnectionStatus | string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitoringSourceListResponse {
  items: MonitoringSource[];
  total: number;
}

export interface MonitoringSourceCreatePayload {
  name: string;
  source_type: SourceType;
  vendor: string;
  base_url: string;
  auth_method: AuthMethod;
  credentials: Credentials;
  ingestion_mode: IngestionMode;
  poll_interval_seconds?: number | null;
  webhook_secret?: string | null;
  is_enabled: boolean;
}

export type MonitoringSourceUpdatePayload = Partial<MonitoringSourceCreatePayload>;

export interface MonitoringSourceListParams {
  limit: number;
  offset: number;
  search?: string;
  vendor?: string;
  source_type?: SourceType;
  ingestion_mode?: IngestionMode;
  is_enabled?: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency_ms: number;
}

export interface SyncTriggerResponse {
  sync_run_id: string;
  status: "queued";
}
