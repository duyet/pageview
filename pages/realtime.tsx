import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeMetrics } from '../hooks/useRealtimeMetrics'
import { useSocket } from '../hooks/useSocket'
import { RealtimeChart } from '../components/charts/RealtimeChart'
import {
  PageViewsCard,
  UniqueVisitorsCard,
  ActivePagesCard,
  CountriesCard,
} from '../components/RealtimeMetricCard'
import {
  ActivePagesTable,
  RecentCountriesTable,
} from '../components/RealtimeTable'

export default function RealtimePage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { metrics, loading, error, refetch } = useRealtimeMetrics(30000) // 30 seconds
  const { isConnected } = useSocket()

  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date())
    }
  }, [metrics])

  const handleRefresh = () => {
    refetch()
  }

  return (
    <>
      <Head>
        <title>Real-time Analytics - Pageview</title>
        <meta
          name="description"
          content="Real-time analytics dashboard for pageview tracking"
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-normal tracking-tight">
                  Real-time
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last 24 hours live monitoring
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="size-4 text-green-600" />
                  ) : (
                    <WifiOff className="size-4 text-red-600" />
                  )}
                  <Badge
                    variant={isConnected ? 'default' : 'destructive'}
                    className="h-6 px-2 text-xs"
                  >
                    {isConnected ? 'Live' : 'Offline'}
                  </Badge>
                </div>
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
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20">
                <div className="text-sm text-red-600 dark:text-red-400">
                  Error: {error}
                </div>
              </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <PageViewsCard
                value={metrics?.totalViews || 0}
                loading={loading}
              />
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
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">
                  Hourly Traffic (Last 24h)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Real-time traffic patterns
                </p>
              </div>
              <RealtimeChart
                data={metrics?.hourlyViews || []}
                loading={loading}
              />
            </div>

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
            <div className="rounded-lg border border-border/40 bg-background p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>Updated: {lastUpdated.toLocaleTimeString()}</div>
                <div>Auto-refresh: 30s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
