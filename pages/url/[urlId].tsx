// @ts-nocheck - Prisma types not available during build
/**
 * URL Analytics Page
 * Detailed analytics for a specific URL
 * OPTIMIZED: Fixed N+1 query problem
 */

import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Calendar, TrendingUp } from 'lucide-react'
import { Prisma, Country, Url, Host, UA } from '@prisma/client'
import prisma from '@/lib/prisma'
import dayjs from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

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
          <span className="text-muted-foreground">{count}</span>
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
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col space-y-6">
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
                <h1 className="mb-2 text-2xl font-normal tracking-tight">
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
                <div className="text-2xl font-medium">
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
            <div className="rounded-lg border border-border/40 bg-background p-4">
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
                    'MMM D, YYYY h:mm A'
                  )}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/40 bg-background p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4" />
                Total Pageviews
              </div>
              <div className="text-2xl font-medium">
                {pageviewStats._count.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background p-4">
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
                    'MMM D, YYYY h:mm A'
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Countries */}
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Top Countries</h2>
                <p className="text-sm text-muted-foreground">
                  Geographic distribution of visitors
                </p>
              </div>
              {topCountries.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
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
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Top Browsers</h2>
                <p className="text-sm text-muted-foreground">
                  Browser distribution
                </p>
              </div>
              {topBrowsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
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
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Top Operating Systems</h2>
                <p className="text-sm text-muted-foreground">OS distribution</p>
              </div>
              {topOS.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
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
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Top Devices</h2>
                <p className="text-sm text-muted-foreground">
                  Device type distribution
                </p>
              </div>
              {topDevices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
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
            <div className="rounded-lg border border-border/40 bg-background p-6 md:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Top Browser Engines</h2>
                <p className="text-sm text-muted-foreground">
                  Rendering engine distribution
                </p>
              </div>
              {topEngines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
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
