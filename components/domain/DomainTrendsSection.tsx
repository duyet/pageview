import { format } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { TrendData } from '@/app/api/analytics/trends/route';
import { DomainTrendsBarChart } from '@/components/charts/DomainTrendsBarChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { SectionCard } from '@/components/SectionCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type MetricView = 'pageviews' | 'visitors';

interface DomainTrendsSectionProps {
  domain: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  trendsData: TrendData[];
  loading: boolean;
  fetching?: boolean;
}

export function DomainTrendsSection({
  domain,
  dateRange,
  onDateRangeChange,
  trendsData,
  loading,
  fetching = false,
}: DomainTrendsSectionProps) {
  const [metricView, setMetricView] = useState<MetricView>('pageviews');

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {dateRange?.from && dateRange?.to && formatDateRange()}
        </p>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      <SectionCard
        title="Traffic Trends"
        description={`Page views and unique visitors for ${domain}`}
        loading={fetching}
        actions={
          <Tabs
            value={metricView}
            onValueChange={(value) => setMetricView(value as MetricView)}
          >
            <TabsList className="h-9">
              <TabsTrigger value="pageviews" className="text-xs">
                Page Views
              </TabsTrigger>
              <TabsTrigger value="visitors" className="text-xs">
                Unique Visitors
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <DomainTrendsBarChart
          data={trendsData}
          loading={loading}
          metricView={metricView}
        />
      </SectionCard>
    </>
  );
}
