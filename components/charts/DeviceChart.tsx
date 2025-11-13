import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { DeviceData } from '../../pages/api/analytics/devices'

interface DeviceChartProps {
  data: DeviceData[]
  title: string
  loading?: boolean
}

const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
]

export function DeviceChart({ data, title, loading }: DeviceChartProps) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          Loading {title.toLowerCase()}...
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

  // Take top 8 items and group the rest as "Others"
  const topItems = data.slice(0, 8)
  const otherItems = data.slice(8)

  let chartData = [...topItems]

  if (otherItems.length > 0) {
    const othersValue = otherItems.reduce((sum, item) => sum + item.value, 0)
    const othersPercentage = otherItems.reduce(
      (sum, item) => sum + item.percentage,
      0
    )

    chartData.push({
      name: 'Others',
      value: othersValue,
      percentage: othersPercentage,
    })
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
            label={({ name, percentage }) => `${name} (${percentage}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {data.name}
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
