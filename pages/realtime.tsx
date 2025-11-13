import { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
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

      <div className="container mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Real-time</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Last 24 hours live monitoring
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              {isConnected ? (
                <Wifi className="size-3.5 text-green-600" />
              ) : (
                <WifiOff className="size-3.5 text-red-600" />
              )}
              <Badge
                variant={isConnected ? 'default' : 'destructive'}
                className="h-5 px-1.5 text-[10px]"
              >
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
            >
              <RefreshCw
                className={`mr-1 size-3 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 shadow-none">
            <CardContent className="py-3">
              <div className="text-xs text-red-600">Error: {error}</div>
            </CardContent>
          </Card>
        )}

        {/* Compact Metrics Cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Compact Real-time Chart */}
        <Card className="mb-4 border-border/50 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Hourly Traffic (Last 24h)
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time traffic patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <RealtimeChart
              data={metrics?.hourlyViews || []}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Compact Data Tables */}
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ActivePagesTable
            data={metrics?.activePages || []}
            loading={loading}
          />
          <RecentCountriesTable
            data={metrics?.recentCountries || []}
            loading={loading}
          />
        </div>

        {/* Compact Status Footer */}
        <Card className="border-border/50 shadow-none">
          <CardContent className="py-2.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <div>Updated: {lastUpdated.toLocaleTimeString()}</div>
              <div>Auto-refresh: 30s</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
