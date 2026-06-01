'use client';

import type { Host, Url } from '@prisma/client';
import { subDays } from 'date-fns';
import { ArrowLeft, Calendar, ExternalLink, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UrlAnalyticsSection } from '@/components/url/UrlAnalyticsSection';
import { UrlTrendsSection } from '@/components/url/UrlTrendsSection';
import { useTrendsData } from '@/hooks/useAnalytics';
import dayjs from '@/lib/dayjs';

type UrlWithHost = Url & {
  host: Host;
};

type PageViewStats = {
  _count: number;
  _min: {
    createdAt: Date | null;
  };
  _max: {
    createdAt: Date | null;
  };
};

type StatItem = {
  name: string;
  count: number;
  percentage: number;
};

interface UrlClientProps {
  url: UrlWithHost;
  pageviewStats: PageViewStats;
  topCountries: StatItem[];
  topBrowsers: StatItem[];
  topOS: StatItem[];
  topDevices: StatItem[];
  topEngines: StatItem[];
}

function StatBar({ name, count, percentage }: StatItem) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name || 'Unknown'}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{count}</span>
          <Badge variant="secondary" className="text-xs">
            {percentage}%
          </Badge>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export function UrlClient({
  url,
  pageviewStats,
  topCountries,
  topBrowsers,
  topOS,
  topDevices,
  topEngines,
}: UrlClientProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Calculate days from date range
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 30;
    return Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [dateRange]);

  // Use React Query hook for trends data
  const {
    data: trendsResult,
    isLoading: loading,
    isFetching: fetching,
  } = useTrendsData(days, { urlId: url.id });

  const trendsData = trendsResult?.trends || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:px-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div>
            <Link href={`/domain/${url.host.host}`}>
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 h-8 px-2 text-sm"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to {url.host.host}
              </Button>
            </Link>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-xl font-normal tracking-tight text-foreground sm:text-2xl">
                  URL Analytics
                </h1>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-muted-foreground hover:text-foreground"
                >
                  {url.url}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-foreground sm:text-2xl">
                  {pageviewStats._count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Pageviews
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                First Seen
              </div>
              <div className="text-xl font-medium">
                {pageviewStats._min.createdAt
                  ? dayjs(pageviewStats._min.createdAt).fromNow()
                  : 'N/A'}
              </div>
              {pageviewStats._min.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {dayjs(pageviewStats._min.createdAt).format(
                    'MMM D, YYYY h:mm A',
                  )}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4" />
                Total Pageviews
              </div>
              <div className="text-xl font-medium text-foreground sm:text-2xl">
                {pageviewStats._count.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                Last Seen
              </div>
              <div className="text-xl font-medium">
                {pageviewStats._max.createdAt
                  ? dayjs(pageviewStats._max.createdAt).fromNow()
                  : 'N/A'}
              </div>
              {pageviewStats._max.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {dayjs(pageviewStats._max.createdAt).format(
                    'MMM D, YYYY h:mm A',
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Traffic Trends Chart */}
          <UrlTrendsSection
            urlId={url.id}
            urlString={url.url}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            trendsData={trendsData}
            loading={loading}
            fetching={fetching}
          />

          {/* Analytics Charts */}
          <UrlAnalyticsSection urlId={url.id} dateRange={dateRange} />

          {/* Legacy Analytics Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Countries */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Top Countries
                </h2>
                <p className="text-sm text-muted-foreground">
                  Geographic distribution of visitors
                </p>
              </div>
              {topCountries.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="space-y-4">
                  {topCountries.map((item, idx) => (
                    <StatBar key={idx} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Browsers */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Top Browsers
                </h2>
                <p className="text-sm text-muted-foreground">
                  Browser distribution
                </p>
              </div>
              {topBrowsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="space-y-4">
                  {topBrowsers.map((item, idx) => (
                    <StatBar key={idx} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Operating Systems */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Top Operating Systems
                </h2>
                <p className="text-sm text-muted-foreground">OS distribution</p>
              </div>
              {topOS.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="space-y-4">
                  {topOS.map((item, idx) => (
                    <StatBar key={idx} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Devices */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Top Devices
                </h2>
                <p className="text-sm text-muted-foreground">
                  Device type distribution
                </p>
              </div>
              {topDevices.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="space-y-4">
                  {topDevices.map((item, idx) => (
                    <StatBar key={idx} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Engines */}
            <div className="rounded-lg border border-border bg-card p-6 md:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Top Browser Engines
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rendering engine distribution
                </p>
              </div>
              {topEngines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {topEngines.map((item, idx) => (
                    <StatBar key={idx} {...item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
