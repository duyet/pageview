'use client';

import type { Host, Url } from '@prisma/client';
import { subDays } from 'date-fns';
import { Calendar, ExternalLink, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
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
          <span className="tabular-nums text-muted-foreground">{count}</span>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {percentage}%
          </Badge>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

function StatBarCard({
  title,
  description,
  items,
  className,
  columns = 1,
}: {
  title: string;
  description: string;
  items: StatItem[];
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <SectionCard title={title} description={description} className={className}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No data available
        </p>
      ) : (
        <div
          className={columns === 2 ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}
        >
          {items.map((item, idx) => (
            <StatBar key={idx} {...item} />
          ))}
        </div>
      )}
    </SectionCard>
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
          <PageHeader
            title="URL Analytics"
            description={
              <a
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-all font-mono hover:text-foreground"
              >
                {url.url}
                <ExternalLink className="size-3 shrink-0" />
              </a>
            }
            backHref={`/domain/${url.host.host}`}
            backLabel={`Back to ${url.host.host}`}
            actions={
              <div className="text-right">
                <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
                  {pageviewStats._count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Pageviews
                </div>
              </div>
            }
          />

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard padding="md">
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
            </SectionCard>

            <SectionCard padding="md">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4" />
                Total Pageviews
              </div>
              <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
                {pageviewStats._count.toLocaleString()}
              </div>
            </SectionCard>

            <SectionCard padding="md">
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
            </SectionCard>
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
            <StatBarCard
              title="Top Countries"
              description="Geographic distribution of visitors"
              items={topCountries}
            />
            <StatBarCard
              title="Top Browsers"
              description="Browser distribution"
              items={topBrowsers}
            />
            <StatBarCard
              title="Top Operating Systems"
              description="OS distribution"
              items={topOS}
            />
            <StatBarCard
              title="Top Devices"
              description="Device type distribution"
              items={topDevices}
            />
            <StatBarCard
              title="Top Browser Engines"
              description="Rendering engine distribution"
              items={topEngines}
              className="md:col-span-2"
              columns={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
