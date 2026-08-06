export type TrendDirection = "up" | "down" | "flat";
export type TrendSentiment = "positive" | "negative" | "neutral";

export interface Trend {
  direction: TrendDirection;
  value: number;
  sentiment: TrendSentiment;
  label: string;
}

export interface DashboardSummary {
  applications: {
    total: number;
    trend: Trend;
    /** Recent values for the KPI card's mini sparkline, oldest first. */
    sparkline: number[];
  };
  open_alerts: {
    total: number;
    critical: number;
    high: number;
    trend: Trend;
    sparkline: number[];
  };
  open_incidents: {
    total: number;
    trend: Trend;
    sparkline: number[];
  };
  connected_sources: {
    connected: number;
    total: number;
    trend: Trend;
    sparkline: number[];
  };
}

export interface RiskTrendPoint {
  date: string;
  /** Composite operational risk score, 0-100 (higher is riskier). */
  risk_score: number;
}

export interface ApplicationHealthItem {
  application: string;
  health_score: number;
  critical_alerts: number;
  trend: Trend;
}

export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface SeverityBreakdownItem {
  severity: SeverityLevel;
  count: number;
}

export type IncidentPriority = SeverityLevel;
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export interface RecentIncident {
  id: string;
  incident_number: string;
  application: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  owner: string;
}

export type ActivityEventType =
  | "monitoring_source_added"
  | "sync_completed"
  | "incident_created"
  | "correlation_completed"
  | "alert_closed";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  message: string;
  actor?: string;
  timestamp: string;
}

export type SourceConnectionStatus = "connected" | "failed" | "unknown";

export interface SourceStatusItem {
  id: string;
  name: string;
  vendor: string;
  connection_status: SourceConnectionStatus;
  last_sync_at: string | null;
  latency_ms: number | null;
}
