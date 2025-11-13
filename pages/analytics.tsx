import { useState, useEffect } from 'react'
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
import { TrendsChart } from '@/components/charts/TrendsChart'
import { DeviceChart } from '@/components/charts/DeviceChart'
import { LocationChart } from '@/components/charts/LocationChart'
import { TrendData } from './api/analytics/trends'
import { DeviceData } from './api/analytics/devices'
import { LocationData } from './api/analytics/locations'

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [trendsData, setTrendsData] = useState<TrendData[]>([])
  const [devicesData, setDevicesData] = useState<{
    browsers: DeviceData[]
    os: DeviceData[]
    devices: DeviceData[]
  }>({ browsers: [], os: [], devices: [] })
  const [locationsData, setLocationsData] = useState<{
    countries: LocationData[]
    cities: LocationData[]
  }>({ countries: [], cities: [] })

  const [loading, setLoading] = useState({
    trends: true,
    devices: true,
    locations: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      const days = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      setLoading({ trends: true, devices: true, locations: true })

      try {
        // Fetch trends data
        const trendsResponse = await fetch(`/api/analytics/trends?days=${days}`)
        if (trendsResponse.ok) {
          const trendsResult = await trendsResponse.json()
          setTrendsData(trendsResult.trends)
        }
        setLoading((prev) => ({ ...prev, trends: false }))

        // Fetch devices data
        const devicesResponse = await fetch(
          `/api/analytics/devices?days=${days}`
        )
        if (devicesResponse.ok) {
          const devicesResult = await devicesResponse.json()
          setDevicesData({
            browsers: devicesResult.browsers,
            os: devicesResult.os,
            devices: devicesResult.devices,
          })
        }
        setLoading((prev) => ({ ...prev, devices: false }))

        // Fetch locations data
        const locationsResponse = await fetch(
          `/api/analytics/locations?days=${days}`
        )
        if (locationsResponse.ok) {
          const locationsResult = await locationsResponse.json()
          setLocationsData({
            countries: locationsResult.countries,
            cities: locationsResult.cities,
          })
        }
        setLoading((prev) => ({ ...prev, locations: false }))
      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setLoading({ trends: false, devices: false, locations: false })
      }
    }

    fetchData()
  }, [dateRange])

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return ''
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Detailed insights and trends for your website traffic
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Date Range Display */}
        {dateRange?.from && dateRange?.to && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Showing data for:{' '}
                <span className="font-medium">{formatDateRange()}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Trends</CardTitle>
            <CardDescription>
              Page views and unique visitors over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendsChart data={trendsData} loading={loading.trends} />
          </CardContent>
        </Card>

        {/* Device & Location Analytics */}
        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">Device Analytics</TabsTrigger>
            <TabsTrigger value="locations">Geographic Data</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Browsers</CardTitle>
                  <CardDescription>Most popular browsers</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeviceChart
                    data={devicesData.browsers}
                    title="Browsers"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Systems</CardTitle>
                  <CardDescription>Device operating systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeviceChart
                    data={devicesData.os}
                    title="Operating Systems"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                  <CardDescription>Desktop, mobile, and tablet</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeviceChart
                    data={devicesData.devices}
                    title="Device Types"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>Visitors by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <LocationChart
                    data={locationsData.countries}
                    title="Countries"
                    loading={loading.locations}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Cities</CardTitle>
                  <CardDescription>Visitors by city</CardDescription>
                </CardHeader>
                <CardContent>
                  <LocationChart
                    data={locationsData.cities}
                    title="Cities"
                    loading={loading.locations}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
