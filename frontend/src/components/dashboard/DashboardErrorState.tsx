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
  message = "Something went wrong while fetching this section. Try again in a moment.",
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/15 to-destructive/5">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
