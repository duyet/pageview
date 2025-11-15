import { DeviceData } from '../../pages/api/analytics/devices'

interface DeviceHorizontalChartProps {
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

export function DeviceHorizontalChart({
  data,
  title,
  loading,
}: DeviceHorizontalChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">
          No {title.toLowerCase()} data
        </div>
      </div>
    )
  }

  // Take top 8 items
  const topItems = data.slice(0, 8)
  const maxValue = Math.max(...topItems.map((item) => item.value))

  return (
    <div className="space-y-3">
      {topItems.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const color = COLORS[index % COLORS.length]

        return (
          <div key={index} className="group">
            <div className="relative h-9 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
              {/* Colored background bar */}
              <div
                className="absolute inset-0 transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
              {/* Text content on top */}
              <div className="relative flex h-full items-center justify-between px-3 text-xs font-medium">
                <span className="truncate text-white">
                  {item.name}
                </span>
                <span className="ml-2 shrink-0 text-white">
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
