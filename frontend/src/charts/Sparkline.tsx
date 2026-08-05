import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color: string;
  className?: string;
}

export function Sparkline({ data, color, className }: SparklineProps) {
  const points = data.map((value, index) => ({ index, value }));
  const gradientId = `sparkline-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={points} margin={{ top: 2, right: 1, bottom: 0, left: 1 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
