import { PlugZap, RefreshCw, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  useSyncMonitoringSource,
  useTestMonitoringSourceConnection,
} from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import { useSourceStatus } from "@/hooks/use-dashboard";
import { SOURCE_CONNECTION_META } from "@/lib/status-colors";

function formatLastSync(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function MonitoringSourceStatusCard() {
  const { data, isLoading, isError, refetch } = useSourceStatus();
  const testConnection = useTestMonitoringSourceConnection();
  const sync = useSyncMonitoringSource();

  return (
    <DashboardCard
      title="Monitoring Source Status"
      description="Connectivity and freshness of connected integrations"
      icon={Server}
      className="lg:col-span-12"
      noPadding={Boolean(data?.length)}
    >
      {isLoading ? (
        <DashboardSkeleton variant="table" rows={4} className="p-6 pt-0" />
      ) : isError ? (
        <DashboardErrorState onRetry={() => refetch()} className="p-6" />
      ) : !data || data.length === 0 ? (
        <DashboardEmptyState className="p-6" />
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Connection Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{source.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{source.vendor}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={SOURCE_CONNECTION_META[source.connection_status].badgeClass}>
                      {SOURCE_CONNECTION_META[source.connection_status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatLastSync(source.last_sync_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.latency_ms !== null ? `${source.latency_ms} ms` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={testConnection.isPending}
                        onClick={() => testConnection.mutate(source.id, { onSuccess: () => refetch() })}
                      >
                        <PlugZap className="h-3.5 w-3.5" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sync.isPending}
                        onClick={() => sync.mutate(source.id, { onSuccess: () => refetch() })}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Sync
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardCard>
  );
}
