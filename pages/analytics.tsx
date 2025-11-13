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
            <div className="mb-4">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                Traffic Trends
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Page views and unique visitors over time
              </p>
            </div>
            <TrendsChart data={trendsData} loading={loading.trends} />
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
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Browsers
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Most popular
                    </p>
                  </div>
                  <DeviceChart
                    data={devicesData.browsers}
                    title="Browsers"
                    loading={loading.devices}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Operating Systems
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Device OS
                    </p>
                  </div>
                  <DeviceChart
                    data={devicesData.os}
                    title="Operating Systems"
                    loading={loading.devices}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Device Types
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
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

            <TabsContent value="locations" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Top Countries
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Visitors by country
                    </p>
                  </div>
                  <LocationChart
                    data={locationsData.countries}
                    title="Countries"
                    loading={loading.locations}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Top Cities
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
    </div>
  )
}
