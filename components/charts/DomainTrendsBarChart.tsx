import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendData } from '../../pages/api/analytics/trends'
import { MetricView } from '../domain/DomainTrendsSection'

interface DomainTrendsBarChartProps {
  data: TrendData[]
  loading?: boolean
  metricView?: MetricView
}

export function DomainTrendsBarChart({
  data,
  loading,
  metricView = 'both',
}: DomainTrendsBarChartProps) {
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

  const showPageViews = metricView === 'both' || metricView === 'pageviews'
  const showVisitors = metricView === 'both' || metricView === 'visitors'

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
                    {payload.map((entry, index) => (
                      <p
                        key={index}
                        className="text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        <span
                          className="mr-1.5 inline-block size-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        ></span>
                        {entry.name}:{' '}
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {entry.value?.toLocaleString()}
                        </span>
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
            animationDuration={0}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {value}
              </span>
            )}
          />
          {showPageViews && (
            <Bar
              dataKey="pageviews"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              name="Page Views"
              isAnimationActive={false}
            />
          )}
          {showVisitors && (
            <Bar
              dataKey="uniqueVisitors"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Unique Visitors"
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
