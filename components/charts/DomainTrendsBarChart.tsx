import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendData } from '@/app/api/analytics/trends/route';
import type { MetricView } from '../domain/DomainTrendsSection';

interface DomainTrendsBarChartProps {
  data: TrendData[];
  loading?: boolean;
  metricView?: MetricView;
}

export function DomainTrendsBarChart({
  data,
  loading,
  metricView = 'pageviews',
}: DomainTrendsBarChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">Loading trends...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
  }));

  const isPageViewsMode = metricView === 'pageviews';

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
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
                    {payload.map((entry, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        <span
                          className="mr-1.5 inline-block size-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        ></span>
                        {entry.name}:{' '}
                        <span className="font-medium text-foreground">
                          {entry.value?.toLocaleString()}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
            animationDuration={0}
          />
          <Bar
            dataKey={isPageViewsMode ? 'pageviews' : 'uniqueVisitors'}
            fill={
              isPageViewsMode ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'
            }
            radius={[4, 4, 0, 0]}
            name={isPageViewsMode ? 'Page Views' : 'Unique Visitors'}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
