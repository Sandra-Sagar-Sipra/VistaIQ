import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  title = "No data available yet",
  message = "Once activity starts flowing in, it will show up here.",
  icon: Icon = Inbox,
  action,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      {action}
    </div>
  );
}
