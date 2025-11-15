import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { LocationData } from '../../pages/api/analytics/locations'

interface LocationChartProps {
  data: LocationData[]
  title: string
  loading?: boolean
}

export function LocationChart({ data, title, loading }: LocationChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No {title.toLowerCase()} data
        </div>
      </div>
    )
  }

  // Take top 10 items for better readability
  const chartData = data.slice(0, 10)

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
            className="stroke-neutral-200 dark:stroke-neutral-700"
            opacity={0.5}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-neutral-600 dark:text-neutral-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-neutral-600 dark:text-neutral-400"
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {label}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {data.value.toLocaleString()} visits ({data.percentage}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
