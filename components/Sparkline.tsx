import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  className?: string
}

export function Sparkline({
  data,
  color = '#3b82f6',
  className,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
