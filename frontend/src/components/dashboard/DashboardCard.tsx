import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

/**
 * The one shape every dashboard widget is built from: icon + title +
 * optional description on the left, an optional action slot on the right,
 * content below. Keeping this in one place is what makes every card feel
 * like the same product instead of assembled ad hoc.
 */
export function DashboardCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  noPadding = false,
}: DashboardCardProps) {
  return (
    <Card className={cn("flex h-full flex-col hover:shadow-elevated", className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("flex-1", noPadding ? "p-0" : "pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
