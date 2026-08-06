export type ComponentType = "application" | "service" | "database" | "queue" | "cache" | "gateway" | "load_balancer" | "storage" | "external";
export type Priority = "critical" | "high" | "medium" | "low";

export interface Application {
  id: string;
  name: string;
  component_type: ComponentType;
  owner?: string;
  environment_id?: string;
  criticality?: Priority;
  status: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApplicationListParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
}

export interface ApplicationCreatePayload {
  name: string;
  owner?: string;
  environment_id?: string;
  criticality?: Priority;
  status?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ApplicationUpdatePayload {
  name?: string;
  owner?: string;
  environment_id?: string;
  criticality?: Priority;
  status?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
