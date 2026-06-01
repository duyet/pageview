import { Loader2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DeviceData } from '@/app/api/analytics/devices/route';

interface RadialDonutChartProps {
  data: DeviceData[];
  title: string;
  loading?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const COLORS = [
  '#D97706', // amber (primary)
  '#0F766E', // teal
  '#E09145', // warm orange
  '#7C6FA0', // muted purple
  '#2B6CB0', // steel blue
  '#65A30D', // lime green
  '#C2410C', // deep orange
  '#0891B2', // cyan
  '#BE185D', // rose
  '#4F46E5', // indigo
];

export function RadialDonutChart({
  data,
  title,
  loading,
  centerLabel,
  centerValue,
}: RadialDonutChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No {title.toLowerCase()} data
        </div>
      </div>
    );
  }

  // Take top 6 items and group the rest as "Others"
  const topItems = data.slice(0, 6);
  const otherItems = data.slice(6);

  const chartData = [...topItems];

  if (otherItems.length > 0) {
    const othersValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = otherItems.reduce(
      (sum, item) => sum + item.percentage,
      0,
    );

    chartData.push({
      name: 'Others',
      value: othersValue,
      percentage: othersPercentage,
    });
  }

  const total =
    centerValue ??
    chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            cornerRadius={4}
            paddingAngle={2}
            labelLine={false}
            label={false}
            fill="#D97706"
            dataKey="value"
            stroke="none"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground"
          >
            {centerLabel && (
              <tspan
                x="50%"
                dy={centerValue || total ? -10 : 0}
                className="text-xs fill-muted-foreground"
              >
                {centerLabel}
              </tspan>
            )}
            <tspan
              x="50%"
              dy={centerLabel ? 18 : 0}
              className="text-lg font-semibold fill-foreground"
            >
              {centerValue ?? total}
            </tspan>
          </text>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {data.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.value.toLocaleString()} visits ({data.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
