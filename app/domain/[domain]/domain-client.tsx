'use client';

/**
 * Domain Analytics Client Component
 * Interactive UI with React Query hooks and state management
 */

import { subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DomainAnalyticsSection } from '@/components/domain/DomainAnalyticsSection';
import { DomainHeader } from '@/components/domain/DomainHeader';
import { DomainTrendsSection } from '@/components/domain/DomainTrendsSection';
import { DomainUrlTable } from '@/components/domain/DomainUrlTable';
import { useTrendsData } from '@/hooks/useAnalytics';

import type { UrlStat } from './page';

export type DomainClientProps = {
  domain: string;
  urlStats: UrlStat[];
  totalPageviews: number;
  previewCount: number;
};

export function DomainClient({
  domain,
  urlStats,
  totalPageviews,
  previewCount,
}: DomainClientProps) {
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
  } = useTrendsData(days, { host: domain });

  const trendsData = trendsResult?.trends || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 sm:px-6">
        <div className="flex flex-col space-y-4">
          <DomainHeader
            domain={domain}
            totalPageviews={totalPageviews}
            totalUrls={urlStats.length}
            previewCount={previewCount}
          />

          <DomainTrendsSection
            domain={domain}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            trendsData={trendsData}
            loading={loading}
            fetching={fetching}
          />

          <DomainAnalyticsSection domain={domain} dateRange={dateRange} />

          <DomainUrlTable urlStats={urlStats} totalPageviews={totalPageviews} />
        </div>
      </div>
    </div>
  );
}
