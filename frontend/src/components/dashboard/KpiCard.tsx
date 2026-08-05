import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { TREND_SENTIMENT_CLASS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { Trend } from "@/types/dashboard";

interface KpiCardProps {
  label: string;
  description: string;
  value: string;
  icon: LucideIcon;
  trend: Trend;
}

const TREND_ICON: Record<Trend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function KpiCard({ label, description, value, icon: Icon, trend }: KpiCardProps) {
  const TrendIcon = TREND_ICON[trend.direction];
  const sign = trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : "";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            TREND_SENTIMENT_CLASS[trend.sentiment]
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>
            {sign}
            {Math.abs(trend.value)}%
          </span>
          <span className="font-normal text-muted-foreground">{trend.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
