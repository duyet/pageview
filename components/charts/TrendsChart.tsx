import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendData } from '../../pages/api/analytics/trends'

interface TrendsChartProps {
  data: TrendData[]
  loading?: boolean
  totalPageviews?: number
  totalUniqueVisitors?: number
  activeMetric?: 'pageviews' | 'uniqueVisitors'
  onMetricChange?: (metric: 'pageviews' | 'uniqueVisitors') => void
}

type MetricType = 'pageviews' | 'uniqueVisitors'

export function TrendsChart({
  data,
  loading,
  totalPageviews,
  totalUniqueVisitors,
  activeMetric: externalActiveMetric,
  onMetricChange,
}: TrendsChartProps) {
  const [internalActiveMetric, setInternalActiveMetric] =
    useState<MetricType>('pageviews')

  // Use external metric if provided, otherwise use internal state
  const activeMetric = externalActiveMetric || internalActiveMetric

  const handleMetricChange = (metric: MetricType) => {
    setInternalActiveMetric(metric)
    onMetricChange?.(metric)
  }
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          Loading trends...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No data available
        </div>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
  }))

  const metricConfig = {
    pageviews: {
      label: 'Page Views',
      color: '#6366f1',
      dataKey: 'pageviews',
    },
    uniqueVisitors: {
      label: 'Unique Visitors',
      color: '#10b981',
      dataKey: 'uniqueVisitors',
    },
  }

  const currentConfig = metricConfig[activeMetric]

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
            className="text-neutral-600 dark:text-neutral-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-neutral-600 dark:text-neutral-400"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {label}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      <span
                        className="mr-1.5 inline-block size-3 rounded-sm"
                        style={{ backgroundColor: currentConfig.color }}
                      ></span>
                      {currentConfig.label}:{' '}
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {payload[0]?.value?.toLocaleString()}
                      </span>
                    </p>
                  </div>
                )
              }
              return null
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
  )
}

// Compact metric toggle for use in card headers
interface MetricToggleProps {
  activeMetric: 'pageviews' | 'uniqueVisitors'
  onMetricChange: (metric: 'pageviews' | 'uniqueVisitors') => void
  totalPageviews?: number
  totalUniqueVisitors?: number
}

export function MetricToggle({
  activeMetric,
  onMetricChange,
  totalPageviews,
  totalUniqueVisitors,
}: MetricToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800/50">
      <button
        onClick={() => onMetricChange('pageviews')}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          activeMetric === 'pageviews'
            ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
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
            ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
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
  )
}
