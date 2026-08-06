import { ListTree } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useRecentIncidents } from "@/hooks/use-dashboard";
import { INCIDENT_STATUS_META, SEVERITY_META } from "@/lib/status-colors";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function RecentIncidentsCard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useRecentIncidents();

  return (
    <DashboardCard
      title="Recent Incidents"
      description="Latest incidents across all applications"
      icon={ListTree}
      className="lg:col-span-7"
      noPadding={Boolean(data?.length)}
    >
      {isLoading ? (
        <DashboardSkeleton variant="table" rows={5} className="p-6 pt-0" />
      ) : isError ? (
        <DashboardErrorState onRetry={() => refetch()} className="p-6" />
      ) : !data || data.length === 0 ? (
        <DashboardEmptyState className="p-6" />
      ) : (
        <div className="max-h-[360px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((incident) => (
                <TableRow
                  key={incident.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{incident.incident_number}</TableCell>
                  <TableCell>{incident.application}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={SEVERITY_META[incident.priority].badgeClass}>
                      {SEVERITY_META[incident.priority].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={INCIDENT_STATUS_META[incident.status].badgeClass}>
                      {INCIDENT_STATUS_META[incident.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(incident.created_at)}
                  </TableCell>
                  <TableCell>{incident.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardCard>
  );
}
