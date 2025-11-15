// @ts-nocheck - Prisma types not available during build
/**
 * URL Analytics Page
 * Detailed analytics for a specific URL
 * OPTIMIZED: Fixed N+1 query problem
 */

import { useState, useMemo } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { ArrowLeft, ExternalLink, Calendar, TrendingUp } from 'lucide-react'
import { Prisma, Country, Url, Host, UA } from '@prisma/client'
import prisma from '@/lib/prisma'
import dayjs from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { UrlTrendsSection } from '@/components/url/UrlTrendsSection'
import { UrlAnalyticsSection } from '@/components/url/UrlAnalyticsSection'
import { useTrendsData } from '@/hooks/useAnalytics'

type UrlWithHost = Url & {
  host: Host
}

type PageViewStats = {
  _count: number
  _min: {
    createdAt: Date | null
  }
  _max: {
    createdAt: Date | null
  }
}

type StatItem = {
  name: string
  count: number
  percentage: number
}

type Props = {
  url: UrlWithHost
  pageviewStats: PageViewStats
  topCountries: StatItem[]
  topBrowsers: StatItem[]
  topOS: StatItem[]
  topDevices: StatItem[]
  topEngines: StatItem[]
}

/**
 * Stat Bar Component
 */
function StatBar({ name, count, percentage }: StatItem) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name || 'Unknown'}</span>
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-400">
            {count}
          </span>
          <Badge variant="secondary" className="text-xs">
            {percentage}%
          </Badge>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

export default function URLPage({
  url,
  pageviewStats,
  topCountries,
  topBrowsers,
  topOS,
  topDevices,
  topEngines,
}: Props) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Calculate days from date range
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 30
    return Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  }, [dateRange])

  // Use React Query hook for trends data
  const {
    data: trendsResult,
    isLoading: loading,
    isFetching: fetching,
  } = useTrendsData(days, { urlId: url.id })

  const trendsData = trendsResult?.trends || []

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
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
                <h1 className="mb-2 text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                  URL Analytics
                </h1>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  {url.url}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                  {pageviewStats._count.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total Pageviews
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Calendar className="size-4" />
                First Seen
              </div>
              <div className="text-xl font-medium">
                {pageviewStats._min.createdAt
                  ? dayjs(pageviewStats._min.createdAt).fromNow()
                  : 'N/A'}
              </div>
              {pageviewStats._min.createdAt && (
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {dayjs(pageviewStats._min.createdAt).format(
                    'MMM D, YYYY h:mm A'
                  )}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <TrendingUp className="size-4" />
                Total Pageviews
              </div>
              <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                {pageviewStats._count.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Calendar className="size-4" />
                Last Seen
              </div>
              <div className="text-xl font-medium">
                {pageviewStats._max.createdAt
                  ? dayjs(pageviewStats._max.createdAt).fromNow()
                  : 'N/A'}
              </div>
              {pageviewStats._max.createdAt && (
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {dayjs(pageviewStats._max.createdAt).format(
                    'MMM D, YYYY h:mm A'
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

          {/* Legacy Analytics Grid - Keep for backward compatibility */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Countries */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Top Countries
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Geographic distribution of visitors
                </p>
              </div>
              {topCountries.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
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
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Top Browsers
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Browser distribution
                </p>
              </div>
              {topBrowsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
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
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Top Operating Systems
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  OS distribution
                </p>
              </div>
              {topOS.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
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
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Top Devices
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Device type distribution
                </p>
              </div>
              {topDevices.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
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
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50 md:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Top Browser Engines
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Rendering engine distribution
                </p>
              </div>
              {topEngines.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
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
  )
}

/**
 * Server-side data fetching with OPTIMIZED queries (no N+1)
 */
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { urlId } = query
  const id = parseInt(urlId as string)

  // Get URL details
  const url = await prisma.url.findUnique({
    where: { id },
    include: { host: true },
  })

  if (!url) {
    return { notFound: true }
  }

  // Get pageview stats
  const pageviewStats = await prisma.pageView.aggregate({
    where: { urlId: id },
    _count: true,
    _min: { createdAt: true },
    _max: { createdAt: true },
  })

  // OPTIMIZED: Get all grouped data in parallel with joins (NO N+1)
  const [countryGroups, uaGroups] = await Promise.all([
    // Country stats with join
    prisma.pageView.groupBy({
      by: ['countryId'],
      where: {
        urlId: id,
        countryId: { not: null },
      },
      _count: true,
      orderBy: { _count: { countryId: 'desc' } },
      take: 10,
    }),

    // UA stats with join
    prisma.pageView.groupBy({
      by: ['uAId'],
      where: {
        urlId: id,
        uAId: { not: null },
      },
      _count: true,
      orderBy: { _count: { uAId: 'desc' } },
      take: 50,
    }),
  ])

  // Fetch related data in batch (OPTIMIZED - single query each)
  const [countries, uas] = await Promise.all([
    prisma.country.findMany({
      where: {
        id: { in: countryGroups.map((g) => g.countryId!).filter(Boolean) },
      },
    }),
    prisma.uA.findMany({
      where: {
        id: { in: uaGroups.map((g) => g.uAId!).filter(Boolean) },
      },
    }),
  ])

  // Create lookup maps
  const countryMap = new Map(countries.map((c) => [c.id, c.country]))
  const uaMap = new Map(uas.map((u) => [u.id, u]))

  // Helper to create stats
  const createStats = (
    groups: any[],
    mapper: (item: any) => string
  ): StatItem[] => {
    const total = groups.reduce((sum, g) => sum + g._count, 0)
    return groups.map((g) => ({
      name: mapper(g),
      count: g._count,
      percentage: Math.round((g._count / total) * 100),
    }))
  }

  // Top countries
  const topCountries = createStats(
    countryGroups,
    (g) => countryMap.get(g.countryId!) || 'Unknown'
  )

  // Aggregate UA data by type
  const aggregateUAField = (field: keyof UA): StatItem[] => {
    const map = new Map<string, number>()
    uaGroups.forEach((g) => {
      const ua = uaMap.get(g.uAId!)
      if (ua) {
        const value = (ua[field] as string) || 'Unknown'
        map.set(value, (map.get(value) || 0) + g._count)
      }
    })

    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const total = sorted.reduce((sum, [, count]) => sum + count, 0)

    return sorted.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
  }

  const topBrowsers = aggregateUAField('browser')
  const topOS = aggregateUAField('os')
  const topDevices = aggregateUAField('device')
  const topEngines = aggregateUAField('engine')

  return {
    props: {
      url: JSON.parse(JSON.stringify(url)),
      pageviewStats: JSON.parse(JSON.stringify(pageviewStats)),
      topCountries,
      topBrowsers,
      topOS,
      topDevices,
      topEngines,
    },
  }
}
