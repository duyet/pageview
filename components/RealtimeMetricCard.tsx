import { Activity, Eye, Globe, Users } from 'lucide-react';
import { SectionCard } from '@/components/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export function RealtimeMetricCard({
  title,
  value,
  icon,
  change,
  trend = 'neutral',
  loading,
}: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-chart-2'
      : trend === 'down'
        ? 'text-chart-3'
        : 'text-muted-foreground';

  return (
    <SectionCard padding="md">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-20 sm:h-8" />
          {change && <Skeleton className="mt-1 h-4 w-14" />}
        </>
      ) : (
        <>
          <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change && <p className={`mt-1 text-xs ${trendColor}`}>{change}</p>}
        </>
      )}
    </SectionCard>
  );
}

// Pre-configured metric cards for common use cases
export function PageViewsCard({
  value,
  loading,
}: {
  value: number;
  loading?: boolean;
}) {
  return (
    <RealtimeMetricCard
      title="Total Views (24h)"
      value={value}
      icon={<Eye className="size-4 text-muted-foreground" />}
      loading={loading}
    />
  );
}

export function UniqueVisitorsCard({
  value,
  loading,
}: {
  value: number;
  loading?: boolean;
}) {
  return (
    <RealtimeMetricCard
      title="Unique Visitors (24h)"
      value={value}
      icon={<Users className="size-4 text-muted-foreground" />}
      loading={loading}
    />
  );
}

export function ActivePagesCard({
  value,
  loading,
}: {
  value: number;
  loading?: boolean;
}) {
  return (
    <RealtimeMetricCard
      title="Active Pages (1h)"
      value={value}
      icon={<Activity className="size-4 text-muted-foreground" />}
      loading={loading}
    />
  );
}

export function CountriesCard({
  value,
  loading,
}: {
  value: number;
  loading?: boolean;
}) {
  return (
    <RealtimeMetricCard
      title="Countries (1h)"
      value={value}
      icon={<Globe className="size-4 text-muted-foreground" />}
      loading={loading}
    />
  );
}
