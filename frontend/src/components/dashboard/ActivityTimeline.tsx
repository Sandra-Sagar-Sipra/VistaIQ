import {
  CheckCircle2,
  Clock,
  GitMerge,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useActivityFeed } from "@/hooks/use-dashboard";
import type { ActivityEvent, ActivityEventType } from "@/types/dashboard";

const EVENT_META: Record<ActivityEventType, { icon: LucideIcon; className: string }> = {
  monitoring_source_added: { icon: PlugZap, className: "bg-primary/10 text-primary" },
  sync_completed: { icon: RefreshCw, className: "bg-success/10 text-success" },
  incident_created: { icon: ShieldAlert, className: "bg-destructive/10 text-destructive" },
  correlation_completed: { icon: GitMerge, className: "bg-warning/10 text-warning" },
  alert_closed: { icon: CheckCircle2, className: "bg-muted text-muted-foreground" },
};

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function sortNewestFirst(events: ActivityEvent[]) {
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function ActivityTimeline() {
  const { data, isLoading, isError, refetch } = useActivityFeed();
  const events = data ? sortNewestFirst(data) : [];

  return (
    <DashboardCard
      title="Recent Activity"
      description="Latest platform events, newest first"
      icon={Clock}
      className="lg:col-span-4"
    >
      {isLoading ? (
        <DashboardSkeleton variant="timeline" rows={5} />
      ) : isError ? (
        <DashboardErrorState onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <ol className="space-y-5">
          {events.map((event) => {
            const meta = EVENT_META[event.type];
            const Icon = meta.icon;
            return (
              <li key={event.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-foreground">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.actor ? `${event.actor} · ` : ""}
                    {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
