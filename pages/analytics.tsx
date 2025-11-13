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
        {/* Minimal Header */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="font-serif text-xl font-normal tracking-tight">
              Analytics
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to && formatDateRange()}
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Borderless Trends Chart */}
        <div className="rounded-2xl bg-muted/20 p-6">
          <div className="mb-4">
            <h2 className="text-sm font-medium">Traffic Trends</h2>
            <p className="text-xs text-muted-foreground">
              Page views and unique visitors over time
            </p>
          </div>
          <TrendsChart data={trendsData} loading={loading.trends} />
        </div>

        {/* Borderless Device & Location Analytics */}
        <Tabs defaultValue="devices" className="space-y-3">
          <TabsList className="grid h-9 w-full grid-cols-2 bg-muted/40">
            <TabsTrigger value="devices" className="text-xs">
              Devices
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-xs">
              Locations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Browsers</h3>
                  <p className="text-xs text-muted-foreground">Most popular</p>
                </div>
                <DeviceChart
                  data={devicesData.browsers}
                  title="Browsers"
                  loading={loading.devices}
                />
              </div>

              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Operating Systems</h3>
                  <p className="text-xs text-muted-foreground">Device OS</p>
                </div>
                <DeviceChart
                  data={devicesData.os}
                  title="Operating Systems"
                  loading={loading.devices}
                />
              </div>

              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Device Types</h3>
                  <p className="text-xs text-muted-foreground">
                    Desktop, mobile, tablet
                  </p>
                </div>
                <DeviceChart
                  data={devicesData.devices}
                  title="Device Types"
                  loading={loading.devices}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Top Countries</h3>
                  <p className="text-xs text-muted-foreground">
                    Visitors by country
                  </p>
                </div>
                <LocationChart
                  data={locationsData.countries}
                  title="Countries"
                  loading={loading.locations}
                />
              </div>

              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Top Cities</h3>
                  <p className="text-xs text-muted-foreground">
                    Visitors by city
                  </p>
                </div>
                <LocationChart
                  data={locationsData.cities}
                  title="Cities"
                  loading={loading.locations}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
