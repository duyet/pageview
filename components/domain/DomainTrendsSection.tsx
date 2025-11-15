import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/DateRangePicker'
import { DomainTrendsBarChart } from '@/components/charts/DomainTrendsBarChart'
import { TrendData } from '@/pages/api/analytics/trends'

interface DomainTrendsSectionProps {
  domain: string
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  trendsData: TrendData[]
  loading: boolean
}

export function DomainTrendsSection({
  domain,
  dateRange,
  onDateRangeChange,
  trendsData,
  loading,
}: DomainTrendsSectionProps) {
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
        <div className="mb-4">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
            Traffic Trends
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Page views and unique visitors for {domain}
          </p>
        </div>
        <DomainTrendsBarChart data={trendsData} loading={loading} />
      </div>
    </>
  )
}
