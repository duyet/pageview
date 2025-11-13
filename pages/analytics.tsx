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
    <div className="container mx-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4">
        {/* Compact Header */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to && formatDateRange()}
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Compact Trends Chart */}
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Traffic Trends
            </CardTitle>
            <CardDescription className="text-xs">
              Page views and unique visitors over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <TrendsChart data={trendsData} loading={loading.trends} />
          </CardContent>
        </Card>

        {/* Compact Device & Location Analytics */}
        <Tabs defaultValue="devices" className="space-y-3">
          <TabsList className="grid h-9 w-full grid-cols-2">
            <TabsTrigger value="devices" className="text-xs">
              Device Analytics
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-xs">
              Geographic Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Browsers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Most popular browsers
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <DeviceChart
                    data={devicesData.browsers}
                    title="Browsers"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Operating Systems
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Device OS
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <DeviceChart
                    data={devicesData.os}
                    title="Operating Systems"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Device Types
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Desktop, mobile, tablet
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <DeviceChart
                    data={devicesData.devices}
                    title="Device Types"
                    loading={loading.devices}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Top Countries
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Visitors by country
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <LocationChart
                    data={locationsData.countries}
                    title="Countries"
                    loading={loading.locations}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Top Cities
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Visitors by city
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
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
