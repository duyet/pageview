import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
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
        <div className="text-muted-foreground">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-muted-foreground">
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
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.value.toLocaleString()} visits ({data.percentage}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
