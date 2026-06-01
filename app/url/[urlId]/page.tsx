import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { UrlClient } from './url-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ urlId: string }>
}): Promise<Metadata> {
  const { urlId } = await params
  const id = parseInt(urlId)

  const url = await prisma.url.findUnique({
    where: { id },
    include: { host: true },
  })

  if (!url) {
    return { title: 'URL Not Found - PageView' }
  }

  return {
    title: `${url.host.host} - URL Analytics - PageView`,
    description: `Detailed analytics for ${url.url}`,
  }
}

export default async function UrlPage({
  params,
}: {
  params: Promise<{ urlId: string }>
}) {
  const { urlId } = await params
  const id = parseInt(urlId)

  // Get URL details
  const url = await prisma.url.findUnique({
    where: { id },
    include: { host: true },
  })

  if (!url) {
    notFound()
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
  type StatItem = { name: string; count: number; percentage: number }

  const createStats = (
    groups: { _count: number; [key: string]: any }[],
    mapper: (item: { _count: number; [key: string]: any }) => string
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
  const aggregateUAField = (
    field: 'browser' | 'os' | 'device' | 'engine'
  ): StatItem[] => {
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

  return (
    <UrlClient
      url={url}
      pageviewStats={pageviewStats}
      topCountries={topCountries}
      topBrowsers={topBrowsers}
      topOS={topOS}
      topDevices={topDevices}
      topEngines={topEngines}
    />
  )
}
