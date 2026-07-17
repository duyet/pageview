import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { DeviceHorizontalChart } from '@/components/charts/DeviceHorizontalChart';
import { LocationChart } from '@/components/charts/LocationChart';
import { SectionCard } from '@/components/SectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevicesData, useLocationsData } from '@/hooks/useAnalytics';

interface DomainAnalyticsSectionProps {
  domain: string;
  dateRange: DateRange | undefined;
}

export function DomainAnalyticsSection({
  domain,
  dateRange,
}: DomainAnalyticsSectionProps) {
  // Calculate days from date range
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 30;
    return Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [dateRange]);

  // Use React Query hooks for data fetching
  const {
    data: devicesResult,
    isLoading: loadingDevices,
    isFetching: fetchingDevices,
  } = useDevicesData(days, { host: domain });

  const {
    data: locationsResult,
    isLoading: loadingLocations,
    isFetching: fetchingLocations,
  } = useLocationsData(days, { host: domain });

  const devicesData = {
    browsers: devicesResult?.browsers || [],
    os: devicesResult?.os || [],
    devices: devicesResult?.devices || [],
  };

  const locationsData = {
    countries: locationsResult?.countries || [],
    cities: locationsResult?.cities || [],
  };

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
          <SectionCard
            padding="md"
            title="Browsers"
            description="Most popular"
            loading={fetchingDevices}
          >
            <DeviceHorizontalChart
              data={devicesData.browsers}
              title="Browsers"
              loading={loadingDevices}
            />
          </SectionCard>

          <SectionCard
            padding="md"
            title="Operating Systems"
            description="Device OS"
            loading={fetchingDevices}
          >
            <DeviceHorizontalChart
              data={devicesData.os}
              title="Operating Systems"
              loading={loadingDevices}
            />
          </SectionCard>

          <SectionCard
            padding="md"
            title="Device Types"
            description="Desktop, mobile, tablet"
            loading={fetchingDevices}
          >
            <DeviceHorizontalChart
              data={devicesData.devices}
              title="Device Types"
              loading={loadingDevices}
            />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="locations" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard
            padding="md"
            title="Top Countries"
            description="Visitors by country"
            loading={fetchingLocations}
          >
            <LocationChart
              data={locationsData.countries}
              title="Countries"
              loading={loadingLocations}
            />
          </SectionCard>

          <SectionCard
            padding="md"
            title="Top Cities"
            description="Visitors by city"
            loading={fetchingLocations}
          >
            <LocationChart
              data={locationsData.cities}
              title="Cities"
              loading={loadingLocations}
            />
          </SectionCard>
        </div>
      </TabsContent>
    </Tabs>
  );
}
