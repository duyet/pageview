import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendData } from '@/app/api/analytics/trends/route';

interface TrendsChartProps {
  data: TrendData[];
  loading?: boolean;
  totalPageviews?: number;
  totalUniqueVisitors?: number;
  activeMetric?: 'pageviews' | 'uniqueVisitors';
  onMetricChange?: (metric: 'pageviews' | 'uniqueVisitors') => void;
}

type MetricType = 'pageviews' | 'uniqueVisitors';

export function TrendsChart({
  data,
  loading,
  totalPageviews,
  totalUniqueVisitors,
  activeMetric: externalActiveMetric,
  onMetricChange,
}: TrendsChartProps) {
  const [internalActiveMetric, setInternalActiveMetric] =
    useState<MetricType>('pageviews');

  // Use external metric if provided, otherwise use internal state
  const activeMetric = externalActiveMetric || internalActiveMetric;

  const _handleMetricChange = (metric: MetricType) => {
    setInternalActiveMetric(metric);
    onMetricChange?.(metric);
  };
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading trends...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground dark:text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
  }));

  const metricConfig = {
    pageviews: {
      label: 'Page Views',
      color: '#D97706',
      dataKey: 'pageviews',
    },
    uniqueVisitors: {
      label: 'Unique Visitors',
      color: '#0F766E',
      dataKey: 'uniqueVisitors',
    },
  };

  const currentConfig = metricConfig[activeMetric];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-neutral-200 dark:stroke-neutral-700"
            opacity={0.5}
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground dark:text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-muted-foreground dark:text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg dark:border-border bg-card">
                    <p className="mb-1 text-sm font-medium text-foreground dark:text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      <span
                        className="mr-1.5 inline-block size-3 rounded-sm"
                        style={{ backgroundColor: currentConfig.color }}
                      ></span>
                      {currentConfig.label}:{' '}
                      <span className="font-medium text-foreground dark:text-foreground">
                        {payload[0]?.value?.toLocaleString()}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey={currentConfig.dataKey}
            fill={currentConfig.color}
            radius={[4, 4, 0, 0]}
            name={currentConfig.label}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Compact metric toggle for use in card headers
interface MetricToggleProps {
  activeMetric: 'pageviews' | 'uniqueVisitors';
  onMetricChange: (metric: 'pageviews' | 'uniqueVisitors') => void;
  totalPageviews?: number;
  totalUniqueVisitors?: number;
}

export function MetricToggle({
  activeMetric,
  onMetricChange,
  totalPageviews,
  totalUniqueVisitors,
}: MetricToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-0.5 dark:border-border ">
      <button
        onClick={() => onMetricChange('pageviews')}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          activeMetric === 'pageviews'
            ? 'bg-card text-foreground shadow-sm dark:bg-neutral-700 dark:text-foreground'
            : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
        }`}
      >
        Page Views
        {totalPageviews !== undefined && (
          <span className="ml-1 font-semibold">
            ({totalPageviews.toLocaleString()})
          </span>
        )}
      </button>
      <button
        onClick={() => onMetricChange('uniqueVisitors')}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          activeMetric === 'uniqueVisitors'
            ? 'bg-card text-foreground shadow-sm dark:bg-neutral-700 dark:text-foreground'
            : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
        }`}
      >
        Unique Visitors
        {totalUniqueVisitors !== undefined && (
          <span className="ml-1 font-semibold">
            ({totalUniqueVisitors.toLocaleString()})
          </span>
        )}
      </button>
    </div>
  );
}
