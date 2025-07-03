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
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
]

export function DeviceChart({ data, title, loading }: DeviceChartProps) {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-muted-foreground">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-muted-foreground">
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
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
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
