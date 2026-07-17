import { Loader2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DeviceData } from '@/app/api/analytics/devices/route';
import { EmptyChartState } from '@/components/charts/EmptyChartState';

interface RadialDonutChartProps {
  data: DeviceData[];
  title: string;
  loading?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const COLORS = [
  'hsl(var(--chart-1))', // orange (primary)
  'hsl(var(--chart-2))', // teal
  'hsl(var(--chart-3))', // amber
  'hsl(var(--chart-4))', // muted purple
  'hsl(var(--chart-5))', // steel blue
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyChartState
        title={`No ${title.toLowerCase()} data`}
        description="Data will appear as traffic comes in"
        illustration="chart"
      />
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
            fill="hsl(var(--chart-1))"
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
