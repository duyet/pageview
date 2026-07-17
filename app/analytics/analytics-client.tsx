'use client';

import { format, subDays } from 'date-fns';
import { Bot } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { AudienceListChart } from '@/components/charts/AudienceChart';
import {
  BotOverviewChart,
  BotTypeChart,
  TopBotsChart,
} from '@/components/charts/BotChart';
import { DeviceChart } from '@/components/charts/DeviceChart';
import GradientOrb from '@/components/charts/GradientOrb';
import { LocationChart } from '@/components/charts/LocationChart';
import { RadialDonutChart } from '@/components/charts/RadialDonutChart';
import { MetricToggle, TrendsChart } from '@/components/charts/TrendsChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import {
  useAudienceData,
  useBotsData,
  useDevicesData,
  useLocationsData,
  useTrendsData,
} from '@/hooks/useAnalytics';

export function AnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [activeMetric, setActiveMetric] = useState<
    'pageviews' | 'uniqueVisitors'
  >('pageviews');

  const [excludeBots, setExcludeBots] = useState(false);

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
    data: trendsResult,
    isLoading: loadingTrends,
    isFetching: fetchingTrends,
  } = useTrendsData(days, { excludeBots });

  const {
    data: devicesResult,
    isLoading: loadingDevices,
    isFetching: fetchingDevices,
  } = useDevicesData(days, { excludeBots });

  const {
    data: locationsResult,
    isLoading: loadingLocations,
    isFetching: fetchingLocations,
  } = useLocationsData(days, { excludeBots });

  const {
    data: botsResult,
    isLoading: loadingBots,
    isFetching: fetchingBots,
  } = useBotsData(days);

  const {
    data: audienceResult,
    isLoading: loadingAudience,
    isFetching: fetchingAudience,
  } = useAudienceData(days, { excludeBots });

  const trendsData = trendsResult?.trends || [];
  const trendsTotals = {
    totalPageviews: trendsResult?.totalPageviews || 0,
    totalUniqueVisitors: trendsResult?.totalUniqueVisitors || 0,
  };
  const devicesData = {
    browsers: devicesResult?.browsers || [],
    os: devicesResult?.os || [],
    devices: devicesResult?.devices || [],
  };
  const locationsData = {
    countries: locationsResult?.countries || [],
    cities: locationsResult?.cities || [],
  };

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:px-6">
        <div className="relative flex flex-col space-y-4">
          {/* Ambient background */}
          <GradientOrb
            variant="amber"
            size={300}
            className="-top-20 -right-20"
          />
          <GradientOrb variant="teal" size={250} className="-top-10 -left-16" />

          {/* Header */}
          <PageHeader
            title="Analytics"
            description={dateRange?.from && dateRange?.to && formatDateRange()}
            actions={
              <>
                <Toggle
                  variant="outline"
                  pressed={excludeBots}
                  onPressedChange={setExcludeBots}
                  aria-label="Exclude bot traffic"
                  className="h-9 gap-2 bg-card px-3 shadow-none data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  <Bot className="size-4" />
                  <span>{excludeBots ? 'Bots Excluded' : 'Include Bots'}</span>
                </Toggle>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </>
            }
          />

          {/* Trends Chart */}
          <SectionCard
            title="Traffic Trends"
            description="Page views and unique visitors over time"
            loading={fetchingTrends}
            actions={
              <MetricToggle
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                totalPageviews={trendsTotals.totalPageviews}
                totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              />
            }
          >
            <TrendsChart
              data={trendsData}
              loading={loadingTrends}
              totalPageviews={trendsTotals.totalPageviews}
              totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              activeMetric={activeMetric}
            />
          </SectionCard>

          {/* Device, Location & Bot Analytics */}
          <Tabs defaultValue="devices" className="space-y-4">
            <TabsList className="grid h-10 w-full grid-cols-4">
              <TabsTrigger value="devices" className="text-sm">
                Devices
              </TabsTrigger>
              <TabsTrigger value="locations" className="text-sm">
                Locations
              </TabsTrigger>
              <TabsTrigger value="audience" className="text-sm">
                Audience & UTMs
              </TabsTrigger>
              <TabsTrigger value="bots" className="text-sm">
                Bots
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
                  <DeviceChart
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
                  <DeviceChart
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
                  <RadialDonutChart
                    data={devicesData.devices}
                    title="Device Types"
                    loading={loadingDevices}
                    centerLabel="Devices"
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

            <TabsContent value="audience" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <SectionCard
                  padding="md"
                  title="UTM Campaigns"
                  description="Traffic by UTM campaign"
                  loading={fetchingAudience}
                >
                  <AudienceListChart
                    data={audienceResult?.utmCampaigns || []}
                    title="Campaigns"
                    loading={loadingAudience}
                  />
                </SectionCard>

                <SectionCard
                  padding="md"
                  title="Languages"
                  description="Browser locale preferences"
                  loading={fetchingAudience}
                >
                  <AudienceListChart
                    data={audienceResult?.languages || []}
                    title="Languages"
                    loading={loadingAudience}
                  />
                </SectionCard>

                <SectionCard
                  padding="md"
                  title="Screen Resolutions"
                  description="Viewport width & height"
                  loading={fetchingAudience}
                >
                  <AudienceListChart
                    data={audienceResult?.viewports || []}
                    title="Resolutions"
                    loading={loadingAudience}
                  />
                </SectionCard>
              </div>
            </TabsContent>

            <TabsContent value="bots" className="space-y-4">
              <SectionCard
                title="Bot vs Human Traffic"
                description="Traffic breakdown by source type"
                loading={fetchingBots}
              >
                <BotOverviewChart data={botsResult} loading={loadingBots} />
              </SectionCard>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard
                  padding="md"
                  title="Bot Types"
                  description="Distribution by bot category"
                  loading={fetchingBots}
                >
                  <BotTypeChart data={botsResult} loading={loadingBots} />
                </SectionCard>

                <SectionCard
                  padding="md"
                  title="Top Bots"
                  description="Most active bot agents"
                  loading={fetchingBots}
                >
                  <TopBotsChart data={botsResult} loading={loadingBots} />
                </SectionCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
