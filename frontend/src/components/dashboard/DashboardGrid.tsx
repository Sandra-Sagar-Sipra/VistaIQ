import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * A 12-column canvas for dashboard widgets. Individual cards opt into a
 * width via their own `lg:col-span-*` class rather than the grid dictating
 * uniform cells, so a table and a donut chart can sit side by side without
 * either one stretching to match the other's height.
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  return <div className={cn("grid grid-cols-1 gap-5 lg:grid-cols-12", className)}>{children}</div>;
}
