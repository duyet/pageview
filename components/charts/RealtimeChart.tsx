import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { RealtimeMetrics } from '../../types/socket'

interface RealtimeChartProps {
  data: RealtimeMetrics['hourlyViews']
  loading?: boolean
}

export function RealtimeChart({ data, loading }: RealtimeChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          Loading real-time data...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No real-time data available
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-neutral-200 dark:stroke-neutral-700"
            opacity={0.5}
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-neutral-600 dark:text-neutral-400"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
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
                        className="mr-1.5 inline-block size-3 rounded-full"
                        style={{ backgroundColor: payload[0].color }}
                      ></span>
                      Views:{' '}
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {payload[0].value?.toLocaleString()}
                      </span>
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
