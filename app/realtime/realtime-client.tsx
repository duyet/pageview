'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import GradientOrb from '@/components/charts/GradientOrb';
import { LocationMap } from '@/components/charts/LocationMap';
import { RealtimeChart } from '@/components/charts/RealtimeChart';
import { PageHeader } from '@/components/PageHeader';
import {
  ActivePagesCard,
  CountriesCard,
  PageViewsCard,
  UniqueVisitorsCard,
} from '@/components/RealtimeMetricCard';
import {
  ActivePagesTable,
  RecentCountriesTable,
} from '@/components/RealtimeTable';
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';

export function RealtimeClient() {
  // Starts null so the server and first client render match (a Date created
  // during render differs between them and caused a hydration failure).
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { metrics, loading, error, isConnected, refetch } =
    useRealtimeMetrics(30000); // 30 seconds

  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date());
    }
  }, [metrics]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:px-6">
        <div className="relative flex flex-col space-y-4">
          {/* Ambient background */}
          <GradientOrb
            variant="teal"
            size={280}
            className="-top-16 -right-16"
          />

          {/* Header */}
          <PageHeader
            title="Real-time"
            description="Last 24 hours live monitoring"
            actions={
              <>
                {isConnected ? (
                  <Badge
                    variant="outline"
                    className="h-7 gap-1.5 bg-card px-2.5 text-xs font-medium"
                  >
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-chart-2" />
                    </span>
                    Live
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                  >
                    <WifiOff className="size-3" />
                    Offline
                  </Badge>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-sm"
                >
                  <RefreshCw
                    className={`mr-1.5 size-4 ${loading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </>
            }
          />

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>Error: {error}</span>
            </div>
          )}

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <PageViewsCard value={metrics?.totalViews || 0} loading={loading} />
            <UniqueVisitorsCard
              value={metrics?.uniqueVisitors || 0}
              loading={loading}
            />
            <ActivePagesCard
              value={metrics?.activePages?.length || 0}
              loading={loading}
            />
            <CountriesCard
              value={metrics?.recentCountries?.length || 0}
              loading={loading}
            />
          </div>

          {/* Real-time Chart */}
          <SectionCard
            title="Hourly Traffic (Last 24h)"
            description="Real-time traffic patterns"
          >
            <RealtimeChart
              data={metrics?.hourlyViews || []}
              loading={loading}
            />
          </SectionCard>

          {/* Location Map */}
          <SectionCard
            title="Visitor Locations (Last Hour)"
            description="Geographic distribution of recent visitors"
          >
            <LocationMap
              data={metrics?.recentCountries || []}
              loading={loading}
            />
          </SectionCard>

          {/* Data Tables */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ActivePagesTable
              data={metrics?.activePages || []}
              loading={loading}
            />
            <RecentCountriesTable
              data={metrics?.recentCountries || []}
              loading={loading}
            />
          </div>

          {/* Status Footer */}
          <SectionCard padding="md">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
              </div>
              <div>Auto-refresh: 30s</div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
