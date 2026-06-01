import { Loader2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DeviceData } from '@/app/api/analytics/devices/route';

interface DeviceChartProps {
  data: DeviceData[];
  title: string;
  loading?: boolean;
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

export function DeviceChart({ data, title, loading }: DeviceChartProps) {
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

  // Take top 8 items and group the rest as "Others"
  const topItems = data.slice(0, 8);
  const otherItems = data.slice(8);

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

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
            outerRadius={80}
            fill="#D97706"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {data.name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
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
