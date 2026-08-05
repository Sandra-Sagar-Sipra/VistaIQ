import { ChevronRight, FolderPlus, RefreshCcw, Search, Waypoints, Zap, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardCard } from "@/components/dashboard/DashboardCard";

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
    <DashboardCard title="Quick Actions" description="Jump to common tasks" icon={Zap} className="lg:col-span-4">
      <div className="flex flex-col gap-1">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.to)}
            className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <action.icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{action.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
