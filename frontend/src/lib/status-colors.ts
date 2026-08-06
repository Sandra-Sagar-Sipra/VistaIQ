import type {
  IncidentStatus,
  SeverityLevel,
  SourceConnectionStatus,
  TrendSentiment,
} from "@/types/dashboard";

export type HealthBand = "good" | "warning" | "critical";

export function healthScoreBand(score: number): HealthBand {
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "critical";
}

export const HEALTH_BAND_HEX: Record<HealthBand, string> = {
  good: "hsl(142 71% 40%)",
  warning: "hsl(38 92% 45%)",
  critical: "hsl(0 72% 51%)",
};

export const HEALTH_BAND_TEXT_CLASS: Record<HealthBand, string> = {
  good: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

export const SEVERITY_META: Record<SeverityLevel, { label: string; hex: string; badgeClass: string }> = {
  critical: {
    label: "Critical",
    hex: "hsl(0 72% 51%)",
    badgeClass: "bg-destructive/15 text-destructive",
  },
  high: {
    label: "High",
    hex: "hsl(24 89% 52%)",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    hex: "hsl(38 92% 45%)",
    badgeClass: "bg-warning/15 text-warning",
  },
  low: {
    label: "Low",
    hex: "hsl(215 16% 55%)",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; badgeClass: string }> = {
  open: { label: "Open", badgeClass: "bg-destructive/15 text-destructive" },
  investigating: { label: "Investigating", badgeClass: "bg-warning/15 text-warning" },
  resolved: { label: "Resolved", badgeClass: "bg-success/15 text-success" },
  closed: { label: "Closed", badgeClass: "bg-muted text-muted-foreground" },
};

export const SOURCE_CONNECTION_META: Record<SourceConnectionStatus, { label: string; badgeClass: string }> = {
  connected: { label: "Connected", badgeClass: "bg-success/15 text-success" },
  failed: { label: "Failed", badgeClass: "bg-destructive/15 text-destructive" },
  unknown: { label: "Unknown", badgeClass: "bg-muted text-muted-foreground" },
};

export const TREND_SENTIMENT_CLASS: Record<TrendSentiment, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};
