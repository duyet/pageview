import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyChartState } from '@/components/charts/EmptyChartState';
import type { RealtimeMetrics } from '../../types/socket';

interface RealtimeChartProps {
  data: RealtimeMetrics['hourlyViews'];
  loading?: boolean;
}

export function RealtimeChart({ data, loading }: RealtimeChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading real-time data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyChartState
        title="No real-time data"
        description="Traffic patterns will appear as visitors arrive"
        illustration="activity"
      />
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            opacity={0.5}
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className="mr-1.5 inline-block size-3 rounded-full"
                        style={{ backgroundColor: payload[0].color }}
                      ></span>
                      Views:{' '}
                      <span className="font-medium text-foreground">
                        {payload[0].value?.toLocaleString()}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--chart-1))', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
