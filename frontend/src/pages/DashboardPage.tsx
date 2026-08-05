import { AlertTriangle, AppWindow, Plug, ShieldAlert } from "lucide-react";

import { HealthChart } from "@/charts/HealthChart";
import { SeverityChart } from "@/charts/SeverityChart";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { IncidentTable } from "@/components/dashboard/IncidentTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { RiskApplicationsCard } from "@/components/dashboard/RiskApplicationsCard";
import { SourceStatusTable } from "@/components/dashboard/SourceStatusTable";
import { useDashboardSummary } from "@/hooks/use-dashboard";

function KpiRow() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6">
            <DashboardSkeleton variant="kpi" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border bg-card">
        <DashboardErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border bg-card">
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Applications"
        description="Total onboarded applications"
        value={String(data.applications.total)}
        icon={AppWindow}
        trend={data.applications.trend}
      />
      <KpiCard
        label="Open Alerts"
        description={`${data.open_alerts.critical} critical · ${data.open_alerts.high} high`}
        value={String(data.open_alerts.total)}
        icon={AlertTriangle}
        trend={data.open_alerts.trend}
      />
      <KpiCard
        label="Open Incidents"
        description="Across all applications"
        value={String(data.open_incidents.total)}
        icon={ShieldAlert}
        trend={data.open_incidents.trend}
      />
      <KpiCard
        label="Connected Sources"
        description="Active monitoring integrations"
        value={`${data.connected_sources.connected} / ${data.connected_sources.total}`}
        icon={Plug}
        trend={data.connected_sources.trend}
      />
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />

      <div className="flex-1 space-y-6 px-6 py-6 lg:px-8">
        <KpiRow />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              <HealthChart />
              <SeverityChart />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              <IncidentTable />
              <RiskApplicationsCard />
            </div>

            <ActivityTimeline />

            <SourceStatusTable />
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-6">
              <QuickActionsCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
