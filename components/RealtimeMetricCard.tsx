import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Activity, Eye, Users, Globe } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

export function RealtimeMetricCard({
  title,
  value,
  icon,
  change,
  trend = 'neutral',
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="h-6 bg-muted animate-pulse rounded"></div>
          {change && (
            <div className="h-4 bg-muted animate-pulse rounded mt-1"></div>
          )}
        </CardContent>
      </Card>
    )
  }

  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change && <p className={`text-xs ${trendColor} mt-1`}>{change}</p>}
      </CardContent>
    </Card>
  )
}

// Pre-configured metric cards for common use cases
export function PageViewsCard({
  value,
  loading,
}: {
  value: number
  loading?: boolean
}) {
  return (
    <RealtimeMetricCard
      title="Total Views (24h)"
      value={value}
      icon={<Eye className="h-4 w-4 text-muted-foreground" />}
      loading={loading}
    />
  )
}

export function UniqueVisitorsCard({
  value,
  loading,
}: {
  value: number
  loading?: boolean
}) {
  return (
    <RealtimeMetricCard
      title="Unique Visitors (24h)"
      value={value}
      icon={<Users className="h-4 w-4 text-muted-foreground" />}
      loading={loading}
    />
  )
}

export function ActivePagesCard({
  value,
  loading,
}: {
  value: number
  loading?: boolean
}) {
  return (
    <RealtimeMetricCard
      title="Active Pages (1h)"
      value={value}
      icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      loading={loading}
    />
  )
}

export function CountriesCard({
  value,
  loading,
}: {
  value: number
  loading?: boolean
}) {
  return (
    <RealtimeMetricCard
      title="Countries (1h)"
      value={value}
      icon={<Globe className="h-4 w-4 text-muted-foreground" />}
      loading={loading}
    />
  )
}
