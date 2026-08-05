import { AlertTriangle, AppWindow, Plug, ShieldAlert } from "lucide-react";

import { ApplicationHealthCard } from "@/charts/ApplicationHealthCard";
import { RiskTrendCard } from "@/charts/RiskTrendChart";
import { SeverityChart } from "@/charts/SeverityChart";
import { Card } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MonitoringSourceStatusCard } from "@/components/dashboard/MonitoringSourceStatusCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { RecentIncidentsCard } from "@/components/dashboard/RecentIncidentsCard";
import { RiskApplicationsCard } from "@/components/dashboard/RiskApplicationsCard";
import { useDashboardSummary } from "@/hooks/use-dashboard";

function KpiRow() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6">
            <DashboardSkeleton variant="kpi" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <DashboardErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <DashboardEmptyState />
      </Card>
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
        sparkline={data.applications.sparkline}
        accent="primary"
      />
      <KpiCard
        label="Open Alerts"
        description={`${data.open_alerts.critical} critical · ${data.open_alerts.high} high`}
        value={String(data.open_alerts.total)}
        icon={AlertTriangle}
        trend={data.open_alerts.trend}
        sparkline={data.open_alerts.sparkline}
        accent="destructive"
      />
      <KpiCard
        label="Open Incidents"
        description="Across all applications"
        value={String(data.open_incidents.total)}
        icon={ShieldAlert}
        trend={data.open_incidents.trend}
        sparkline={data.open_incidents.sparkline}
        accent="warning"
      />
      <KpiCard
        label="Connected Sources"
        description="Active monitoring integrations"
        value={`${data.connected_sources.connected} / ${data.connected_sources.total}`}
        icon={Plug}
        trend={data.connected_sources.trend}
        sparkline={data.connected_sources.sparkline}
        accent="success"
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <DashboardGrid>
            <RiskTrendCard />
            <ActivityTimeline />

            <ApplicationHealthCard />
            <SeverityChart />

            <RecentIncidentsCard />
            <RiskApplicationsCard />

            <MonitoringSourceStatusCard />
          </DashboardGrid>

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
