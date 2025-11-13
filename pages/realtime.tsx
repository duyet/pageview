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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real-time Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Live monitoring of your website traffic and visitor behavior
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="size-4 text-green-600" />
              ) : (
                <WifiOff className="size-4 text-red-600" />
              )}
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-600">
                Error loading real-time data: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Hourly Traffic (Last 24 Hours)</CardTitle>
            <CardDescription>
              Real-time view of your website traffic patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RealtimeChart
              data={metrics?.hourlyViews || []}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Data Tables */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>Last updated: {lastUpdated.toLocaleTimeString()}</div>
              <div>Auto-refresh: Every 30 seconds</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
