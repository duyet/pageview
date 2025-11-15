import { useState } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/DateRangePicker'
import { DomainTrendsBarChart } from '@/components/charts/DomainTrendsBarChart'
import { ChartTitle } from '@/components/charts/ChartTitle'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendData } from '@/pages/api/analytics/trends'

export type MetricView = 'pageviews' | 'visitors'

interface DomainTrendsSectionProps {
  domain: string
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  trendsData: TrendData[]
  loading: boolean
  fetching?: boolean
}

export function DomainTrendsSection({
  domain,
  dateRange,
  onDateRangeChange,
  trendsData,
  loading,
  fetching = false,
}: DomainTrendsSectionProps) {
  const [metricView, setMetricView] = useState<MetricView>('pageviews')

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return ''
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {dateRange?.from && dateRange?.to && formatDateRange()}
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
        <ChartTitle
          title="Traffic Trends"
          description={`Page views and unique visitors for ${domain}`}
          loading={fetching}
        >
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
        </ChartTitle>
        <DomainTrendsBarChart
          data={trendsData}
          loading={loading}
          metricView={metricView}
        />
      </div>
    </>
  )
}
