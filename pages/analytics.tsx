import { useState, useMemo } from 'react'
import Head from 'next/head'
import { format, subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/DateRangePicker'
import {
  TrendsChart,
  MetricToggle,
} from '@/components/charts/TrendsChart'
import { DeviceChart } from '@/components/charts/DeviceChart'
import { LocationChart } from '@/components/charts/LocationChart'
import { ChartTitle } from '@/components/charts/ChartTitle'
import {
  useTrendsData,
  useDevicesData,
  useLocationsData,
} from '@/hooks/useAnalytics'

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [activeMetric, setActiveMetric] = useState<
    'pageviews' | 'uniqueVisitors'
  >('pageviews')

  // Calculate days from date range
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 30
    return Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  }, [dateRange])

  // Use React Query hooks for data fetching
  const {
    data: trendsResult,
    isLoading: loadingTrends,
    isFetching: fetchingTrends,
  } = useTrendsData(days)

  const {
    data: devicesResult,
    isLoading: loadingDevices,
    isFetching: fetchingDevices,
  } = useDevicesData(days)

  const {
    data: locationsResult,
    isLoading: loadingLocations,
    isFetching: fetchingLocations,
  } = useLocationsData(days)

  const trendsData = trendsResult?.trends || []
  const trendsTotals = {
    totalPageviews: trendsResult?.totalPageviews || 0,
    totalUniqueVisitors: trendsResult?.totalUniqueVisitors || 0,
  }
  const devicesData = {
    browsers: devicesResult?.browsers || [],
    os: devicesResult?.os || [],
    devices: devicesResult?.devices || [],
  }
  const locationsData = {
    countries: locationsResult?.countries || [],
    cities: locationsResult?.cities || [],
  }

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return ''
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard - Pageview Analytics</title>
        <meta
          name="description"
          content="Advanced analytics dashboard with traffic trends, device breakdowns, and location insights. Track pageviews, unique visitors, and audience demographics with privacy-first analytics."
        />
        <meta
          property="og:title"
          content="Analytics Dashboard - Pageview Analytics"
        />
        <meta
          property="og:description"
          content="Advanced analytics dashboard with traffic trends, device breakdowns, and location insights."
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
      <div className="mx-auto max-w-4xl p-4 sm:px-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                Analytics
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {dateRange?.from && dateRange?.to && formatDateRange()}
              </p>
            </div>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Trends Chart */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
            <ChartTitle
              title="Traffic Trends"
              description="Page views and unique visitors over time"
              loading={fetchingTrends}
            >
              <MetricToggle
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                totalPageviews={trendsTotals.totalPageviews}
                totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              />
            </ChartTitle>
            <TrendsChart
              data={trendsData}
              loading={loadingTrends}
              totalPageviews={trendsTotals.totalPageviews}
              totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              activeMetric={activeMetric}
            />
          </div>

          {/* Device & Location Analytics */}
          <Tabs defaultValue="devices" className="space-y-4">
            <TabsList className="grid h-10 w-full grid-cols-2">
              <TabsTrigger value="devices" className="text-sm">
                Devices
              </TabsTrigger>
              <TabsTrigger value="locations" className="text-sm">
                Locations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <ChartTitle
                    title="Browsers"
                    description="Most popular"
                    loading={fetchingDevices}
                  />
                  <DeviceChart
                    data={devicesData.browsers}
                    title="Browsers"
                    loading={loadingDevices}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <ChartTitle
                    title="Operating Systems"
                    description="Device OS"
                    loading={fetchingDevices}
                  />
                  <DeviceChart
                    data={devicesData.os}
                    title="Operating Systems"
                    loading={loadingDevices}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <ChartTitle
                    title="Device Types"
                    description="Desktop, mobile, tablet"
                    loading={fetchingDevices}
                  />
                  <DeviceChart
                    data={devicesData.devices}
                    title="Device Types"
                    loading={loadingDevices}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <ChartTitle
                    title="Top Countries"
                    description="Visitors by country"
                    loading={fetchingLocations}
                  />
                  <LocationChart
                    data={locationsData.countries}
                    title="Countries"
                    loading={loadingLocations}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <ChartTitle
                    title="Top Cities"
                    description="Visitors by city"
                    loading={fetchingLocations}
                  />
                  <LocationChart
                    data={locationsData.cities}
                    title="Cities"
                    loading={loadingLocations}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </>
  )
}
