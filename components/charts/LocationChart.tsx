import { Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LocationData } from '@/app/api/analytics/locations/route';

interface LocationChartProps {
  data: LocationData[];
  title: string;
  loading?: boolean;
}

export function LocationChart({ data, title, loading }: LocationChartProps) {
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
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">
          No {title.toLowerCase()} data
        </div>
      </div>
    );
  }

  // Take top 10 items for better readability
  const chartData = data.slice(0, 10);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{
            top: 5,
            right: 30,
            left: 60,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            opacity={0.5}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {label}
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
          <Bar
            dataKey="value"
            fill="hsl(var(--chart-1))"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
