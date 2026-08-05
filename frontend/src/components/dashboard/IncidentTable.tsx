import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useRecentIncidents } from "@/hooks/use-dashboard";
import { INCIDENT_STATUS_META, SEVERITY_META } from "@/lib/status-colors";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function IncidentTable() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useRecentIncidents();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
        <CardDescription>Latest incidents across all applications</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <DashboardSkeleton variant="table" rows={5} />
        ) : isError ? (
          <DashboardErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border">
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
                    <TableCell className="text-muted-foreground">{formatDateTime(incident.created_at)}</TableCell>
                    <TableCell>{incident.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
