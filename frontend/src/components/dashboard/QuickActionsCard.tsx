import { FolderPlus, RefreshCcw, Search, Waypoints, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  to: string;
}

const ACTIONS: QuickAction[] = [
  { label: "Add Monitoring Source", icon: FolderPlus, to: "/monitoring-sources?action=add" },
  { label: "Run Manual Sync", icon: RefreshCcw, to: "/monitoring-sources" },
  { label: "Create Mapping", icon: Waypoints, to: "/mappings" },
  { label: "Open Search", icon: Search, to: "/search" },
];

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump to common tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(action.to)}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
