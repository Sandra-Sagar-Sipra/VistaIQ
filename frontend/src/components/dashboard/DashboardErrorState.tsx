import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function DashboardErrorState({
  title = "Couldn't load this data",
  message = "Something went wrong while fetching this section.",
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-center", className)}>
      <div className="rounded-full bg-destructive/10 p-2.5">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
