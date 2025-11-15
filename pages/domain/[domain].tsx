/**
 * Domain Analytics Page
 * Shows all URLs for a specific domain with pageview counts
 */

import { useState, useMemo } from 'react'
import type { GetServerSideProps } from 'next'
import { subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import prisma from '@/lib/prisma'
import { analyzeDomain } from '@/lib/domainGrouping'
import { DomainHeader } from '@/components/domain/DomainHeader'
import { DomainTrendsSection } from '@/components/domain/DomainTrendsSection'
import { DomainAnalyticsSection } from '@/components/domain/DomainAnalyticsSection'
import { DomainUrlTable } from '@/components/domain/DomainUrlTable'
import { useTrendsData } from '@/hooks/useAnalytics'

type UrlStat = {
  id: number
  url: string
  _count: {
    pageViews: number
  }
}

type DomainPageProps = {
  domain: string
  urlStats: UrlStat[]
  totalPageviews: number
  previewCount: number
}

export default function DomainPage({
  domain,
  urlStats,
  totalPageviews,
  previewCount,
}: DomainPageProps) {
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
  } = useTrendsData(days, domain)

  const trendsData = trendsResult?.trends || []

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
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
  )
}

/**
 * Helper function to detect preview subdomains and find related domains
 * Uses intelligent token-based analysis instead of hardcoded patterns
 */
function findRelatedDomains(
  targetDomain: string,
  allDomains: string[]
): string[] {
  const targetAnalysis = analyzeDomain(targetDomain)
  const related: string[] = [targetDomain]

  // Find domains with similar project tokens
  for (const domain of allDomains) {
    if (domain === targetDomain) continue

    const analysis = analyzeDomain(domain)

    // Calculate token overlap
    const targetTokens = new Set(targetAnalysis.projectTokens)
    const domainTokens = new Set(analysis.projectTokens)
    const targetTokensArray = Array.from(targetTokens)
    const intersection = new Set(
      targetTokensArray.filter((t) => domainTokens.has(t))
    )

    // If they share significant tokens, they're related
    const similarity =
      targetTokens.size > 0
        ? intersection.size / Math.min(targetTokens.size, domainTokens.size)
        : 0

    if (similarity >= 0.6) {
      related.push(domain)
    }
  }

  return related
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { domain } = query
  const requestedDomain = domain as string

  // Get all hosts to analyze
  const allHosts = await prisma.host.findMany({
    select: {
      id: true,
      host: true,
    },
  })

  // Find all domains related to the requested domain
  const allHostnames = allHosts.map((h: { id: number; host: string }) => h.host)
  const relatedDomains = findRelatedDomains(requestedDomain, allHostnames)

  // Get IDs of all related hosts
  const matchingHostIds = allHosts
    .filter((host: { id: number; host: string }) =>
      relatedDomains.includes(host.host)
    )
    .map((host: { id: number; host: string }) => host.id)

  // Count preview deployments (all related domains except the requested one)
  const targetAnalysis = analyzeDomain(requestedDomain)
  const previewCount = relatedDomains.filter((d) => {
    if (d === requestedDomain) return false
    const analysis = analyzeDomain(d)
    return analysis.isPreview
  }).length

  // Get URL stats for all matching hosts
  const urlStats: UrlStat[] = await prisma.url.findMany({
    where: {
      hostId: {
        in: matchingHostIds,
      },
    },
    select: {
      id: true,
      url: true,
      _count: true,
    },
    orderBy: {
      pageViews: { _count: 'desc' },
    },
  })

  // Calculate total pageviews
  const totalPageviews = urlStats.reduce(
    (sum, url) => sum + url._count.pageViews,
    0
  )

  return {
    props: {
      urlStats,
      domain: requestedDomain,
      totalPageviews,
      previewCount,
    },
  }
}
