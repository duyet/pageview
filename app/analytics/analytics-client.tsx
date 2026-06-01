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
import { ChartTitle } from '@/components/charts/ChartTitle';
import { DeviceChart } from '@/components/charts/DeviceChart';
import GradientOrb from '@/components/charts/GradientOrb';
import { LocationChart } from '@/components/charts/LocationChart';
import { RadialDonutChart } from '@/components/charts/RadialDonutChart';
import { MetricToggle, TrendsChart } from '@/components/charts/TrendsChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
          <div className="relative flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-xl font-normal tracking-tight text-foreground sm:text-2xl">
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                {dateRange?.from && dateRange?.to && formatDateRange()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExcludeBots(!excludeBots)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  excludeBots
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-border bg-card text-foreground hover:bg-accent'
                }`}
              >
                <Bot className="size-4" />
                <span>{excludeBots ? 'Bots Excluded' : 'Include Bots'}</span>
              </button>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {/* Trends Chart */}
          <div className="rounded-lg border border-border bg-card p-6">
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
                <div className="rounded-lg border border-border bg-card p-4">
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

                <div className="rounded-lg border border-border bg-card p-4">
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

                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="Device Types"
                    description="Desktop, mobile, tablet"
                    loading={fetchingDevices}
                  />
                  <RadialDonutChart
                    data={devicesData.devices}
                    title="Device Types"
                    loading={loadingDevices}
                    centerLabel="Devices"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
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

                <div className="rounded-lg border border-border bg-card p-4">
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

            <TabsContent value="audience" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="UTM Campaigns"
                    description="Traffic by UTM campaign"
                    loading={fetchingAudience}
                  />
                  <AudienceListChart
                    data={audienceResult?.utmCampaigns || []}
                    title="Campaigns"
                    loading={loadingAudience}
                  />
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="Languages"
                    description="Browser locale preferences"
                    loading={fetchingAudience}
                  />
                  <AudienceListChart
                    data={audienceResult?.languages || []}
                    title="Languages"
                    loading={loadingAudience}
                  />
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="Screen Resolutions"
                    description="Viewport width & height"
                    loading={fetchingAudience}
                  />
                  <AudienceListChart
                    data={audienceResult?.viewports || []}
                    title="Resolutions"
                    loading={loadingAudience}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bots" className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <ChartTitle
                  title="Bot vs Human Traffic"
                  description="Traffic breakdown by source type"
                  loading={fetchingBots}
                />
                <BotOverviewChart data={botsResult} loading={loadingBots} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="Bot Types"
                    description="Distribution by bot category"
                    loading={fetchingBots}
                  />
                  <BotTypeChart data={botsResult} loading={loadingBots} />
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <ChartTitle
                    title="Top Bots"
                    description="Most active bot agents"
                    loading={fetchingBots}
                  />
                  <TopBotsChart data={botsResult} loading={loadingBots} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
