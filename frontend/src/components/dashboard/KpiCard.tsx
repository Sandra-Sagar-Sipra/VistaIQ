import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Sparkline } from "@/charts/Sparkline";
import { Card } from "@/components/ui/card";
import { TREND_SENTIMENT_CLASS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { Trend } from "@/types/dashboard";

type Accent = "primary" | "destructive" | "success" | "warning";

interface KpiCardProps {
  label: string;
  description: string;
  value: string;
  icon: LucideIcon;
  trend: Trend;
  sparkline: number[];
  accent?: Accent;
}

const TREND_ICON: Record<Trend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const ACCENT_GLOW_CLASS: Record<Accent, string> = {
  primary: "bg-primary",
  destructive: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
};

const ACCENT_ICON_CLASS: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const ACCENT_SPARKLINE_COLOR: Record<Accent, string> = {
  primary: "#2563EB",
  destructive: "#DC2626",
  success: "#16A34A",
  warning: "#D97706",
};

export function KpiCard({
  label,
  description,
  value,
  icon: Icon,
  trend,
  sparkline,
  accent = "primary",
}: KpiCardProps) {
  const TrendIcon = TREND_ICON[trend.direction];
  const sign = trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : "";

  return (
    <Card className="group relative overflow-hidden p-6 hover:shadow-elevated">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.1]",
          ACCENT_GLOW_CLASS[accent]
        )}
      />

      <div className="relative flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ACCENT_ICON_CLASS[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      <p className="relative mt-3 text-[32px] font-semibold leading-none tracking-tight text-foreground">
        {value}
      </p>

      <div className="relative mt-4 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              TREND_SENTIMENT_CLASS[trend.sentiment]
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>
              {sign}
              {Math.abs(trend.value)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {sparkline.length > 1 && (
          <Sparkline data={sparkline} color={ACCENT_SPARKLINE_COLOR[accent]} className="w-20 shrink-0" />
        )}
      </div>
    </Card>
  );
}
