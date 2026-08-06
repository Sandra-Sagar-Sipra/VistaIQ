import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Incident {incidentId}</CardTitle>
          <CardDescription>Full incident details are not yet available in this build.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page will show the timeline, root cause, correlated alerts, and remediation steps once the
          Incidents module is implemented.
        </CardContent>
      </Card>
    </div>
  );
}
