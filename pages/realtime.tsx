import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeMetrics } from '../hooks/useRealtimeMetrics'
import { RealtimeChart } from '../components/charts/RealtimeChart'
import { LocationMap } from '../components/charts/LocationMap'
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
  const { metrics, loading, error, isConnected, refetch } =
    useRealtimeMetrics(30000) // 30 seconds

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
        <title>Real-time Analytics - Pageview Analytics</title>
        <meta
          name="description"
          content="Live monitoring dashboard showing real-time pageviews, active visitors, and traffic sources. Track your website activity as it happens with 30-second updates and WebSocket connectivity."
        />
        <meta
          property="og:title"
          content="Real-time Analytics - Pageview Analytics"
        />
        <meta
          property="og:description"
          content="Live monitoring dashboard with real-time pageviews, active visitors, and instant updates via WebSocket."
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
        <div className="mx-auto max-w-4xl p-4 sm:px-6">
          <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                  Real-time
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
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
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Hourly Traffic (Last 24h)
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Real-time traffic patterns
                </p>
              </div>
              <RealtimeChart
                data={metrics?.hourlyViews || []}
                loading={loading}
              />
            </div>

            {/* Location Map */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Visitor Locations (Last Hour)
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Geographic distribution of recent visitors
                </p>
              </div>
              <LocationMap
                data={metrics?.recentCountries || []}
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
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
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
