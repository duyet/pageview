import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeviceHorizontalChart } from '@/components/charts/DeviceHorizontalChart'
import { LocationChart } from '@/components/charts/LocationChart'
import { DeviceData } from '@/pages/api/analytics/devices'
import { LocationData } from '@/pages/api/analytics/locations'

interface DomainAnalyticsSectionProps {
  domain: string
  dateRange: DateRange | undefined
}

export function DomainAnalyticsSection({
  domain,
  dateRange,
}: DomainAnalyticsSectionProps) {
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
    devices: true,
    locations: true,
  })

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      const days = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      setLoading({ devices: true, locations: true })

      try {
        // Fetch devices data
        const devicesResponse = await fetch(
          `/api/analytics/devices?days=${days}&host=${encodeURIComponent(domain)}`
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
          `/api/analytics/locations?days=${days}&host=${encodeURIComponent(domain)}`
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
        setLoading({ devices: false, locations: false })
      }
    }

    fetchAnalyticsData()
  }, [dateRange, domain])

  return (
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
            <DeviceHorizontalChart
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
            <DeviceHorizontalChart
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
            <DeviceHorizontalChart
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
  )
}
