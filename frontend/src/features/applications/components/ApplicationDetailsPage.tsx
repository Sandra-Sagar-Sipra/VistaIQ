import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Settings, Activity, Server, LayoutTemplate, HeartPulse, LineChart } from "lucide-react";

import { useApplicationQuery } from "@/features/applications/hooks/use-applications";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const TABS = [
  { id: "overview", label: "Overview", icon: null },
  { id: "components", label: "Components", icon: Server },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "monitoring", label: "Monitoring", icon: LineChart },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: application, isLoading, isError } = useApplicationQuery(id!);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md font-medium text-sm">
          Failed to load application details.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Breadcrumbs and Header */}
      <div className="border-b bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-6">
            <Link to="/applications" className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Applications</span>
            </Link>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/50 shadow-sm">
                <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{application.name}</h1>
              <Badge variant={application.status === 'active' ? 'default' : 'secondary'} className="ml-2 capitalize">
                {application.status}
              </Badge>
            </div>
            {/* Page actions could go here */}
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 border-b border-border/50">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground opacity-70"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col text-sm divide-y divide-border/50">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-muted-foreground font-medium">Owner</dt>
                    <dd className="font-medium text-foreground text-right">
                      {application.owner || <span className="text-muted-foreground italic">Not Assigned</span>}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <dt className="text-muted-foreground font-medium">Criticality</dt>
                    <dd className="font-medium capitalize text-foreground text-right">
                      {application.criticality ? (
                         <Badge variant="outline" className="capitalize">{application.criticality}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic">Not Assigned</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lifecycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col text-sm divide-y divide-border/50">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-muted-foreground font-medium">Created At</dt>
                    <dd className="font-medium text-foreground text-right">{formatDate(application.created_at)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-muted-foreground font-medium">Updated At</dt>
                    <dd className="font-medium text-foreground text-right">{formatDate(application.updated_at)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-muted-foreground font-medium">Status</dt>
                    <dd className="font-medium capitalize text-foreground flex items-center justify-end gap-2">
                       <div className={`h-2 w-2 rounded-full ${application.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                       {application.status}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.tags && application.tags.length > 0 ? (
                    application.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="px-2.5 py-0.5 rounded-md font-medium">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No tags configured.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== "overview" && (
          <div className="min-h-[400px]"></div>
        )}
      </div>
    </div>
  );
}
