// @ts-nocheck - Legacy endpoint with type issues
import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subHours, startOfHour } from 'date-fns'
import prisma from '../../../lib/prisma'
import { RealtimeMetrics } from '../../../types/socket'

// Simple in-memory cache with 30s TTL as documented
let cachedMetrics: RealtimeMetrics | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30 * 1000 // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealtimeMetrics | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check cache first
  const now = Date.now()
  if (cachedMetrics && now - cacheTimestamp < CACHE_TTL) {
    // Set cache headers for client-side caching
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return res.status(200).json(cachedMetrics)
  }

  try {
    const currentTime = new Date()
    const last24Hours = subHours(currentTime, 24)
    const last1Hour = subHours(currentTime, 1)

    // Optimize: Get total views and unique visitors in a single query using raw SQL
    const [totalViewsResult, uniqueVisitorsResult] = await Promise.all([
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
      }),
      // Use raw SQL for distinct count (more efficient)
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT ip) as count
        FROM "PageView"
        WHERE "createdAt" >= ${last24Hours}
        AND ip IS NOT NULL
      `,
    ])

    const totalViews = totalViewsResult
    const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count || 0)

    // Get most active pages in last hour
    const activePages = await prisma.pageView.groupBy({
      by: ['urlId'],
      where: {
        createdAt: {
          gte: last1Hour,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Get URL details for active pages
    const urlIds = activePages
      .map((page) => page.urlId)
      .filter(Boolean) as number[]
    const urls = await prisma.url.findMany({
      where: {
        id: {
          in: urlIds,
        },
      },
      select: {
        id: true,
        url: true,
      },
    })

    const urlMap = new Map(urls.map((url) => [url.id, url.url]))

    const activePagesData = activePages
      .filter((page) => page.urlId && urlMap.has(page.urlId))
      .map((page) => ({
        path: urlMap.get(page.urlId!) || 'Unknown',
        views: page._count.id,
      }))

    // Get recent countries in last hour
    const recentCountries = await prisma.pageView.groupBy({
      by: ['countryId'],
      where: {
        createdAt: {
          gte: last1Hour,
        },
        countryId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    // Get country details
    const countryIds = recentCountries
      .map((c) => c.countryId)
      .filter(Boolean) as number[]
    const countries = await prisma.country.findMany({
      where: {
        id: {
          in: countryIds,
        },
      },
      select: {
        id: true,
        country: true,
      },
    })

    const countryMap = new Map(countries.map((c) => [c.id, c.country]))

    const recentCountriesData = recentCountries
      .filter((c) => c.countryId && countryMap.has(c.countryId))
      .map((c) => ({
        country: countryMap.get(c.countryId!) || 'Unknown',
        count: c._count.id,
      }))

    // Optimize: Use database-level date truncation for hourly aggregation
    const hourlyViewsRaw = await prisma.$queryRaw<
      Array<{ hour: Date; count: bigint }>
    >`
      SELECT
        DATE_TRUNC('hour', "createdAt") as hour,
        COUNT(*) as count
      FROM "PageView"
      WHERE "createdAt" >= ${last24Hours}
      GROUP BY DATE_TRUNC('hour', "createdAt")
      ORDER BY hour ASC
    `

    // Convert to map for efficient lookup
    const hourlyMap = new Map<string, number>()
    hourlyViewsRaw.forEach((item) => {
      const hourKey = format(new Date(item.hour), 'yyyy-MM-dd HH:00')
      hourlyMap.set(hourKey, Number(item.count))
    })

    // Generate complete 24-hour range with zero-filled missing hours
    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(currentTime, i))
      const hourKey = format(hour, 'yyyy-MM-dd HH:00')
      const hourLabel = format(hour, 'HH:00')

      hourlyData.push({
        hour: hourLabel,
        views: hourlyMap.get(hourKey) || 0,
      })
    }

    const metrics: RealtimeMetrics = {
      totalViews,
      uniqueVisitors,
      activePages: activePagesData,
      recentCountries: recentCountriesData,
      hourlyViews: hourlyData,
    }

    // Update cache
    cachedMetrics = metrics
    cacheTimestamp = Date.now()

    // Set cache headers for CDN/client-side caching
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    res.status(200).json(metrics)
  } catch (error) {
    console.error('Realtime metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
