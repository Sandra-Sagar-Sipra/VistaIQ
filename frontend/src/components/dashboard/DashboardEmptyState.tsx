import { Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

export function DashboardEmptyState({
  title = "No dashboard data available",
  message,
  icon: Icon = Inbox,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-10 text-center", className)}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
