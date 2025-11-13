/**
 * GET /api/v1/realtime/metrics
 * Get real-time metrics (last 24 hours)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { subHours } from 'date-fns'
import { createApiHandler } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { realtimeMetricsQuerySchema } from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'
import type { RealtimeMetrics } from '@/types/api'

// Cache for 30 seconds
let cache: { data: RealtimeMetrics; timestamp: number } | null = null
const CACHE_DURATION = 30 * 1000 // 30 seconds

/**
 * GET handler
 */
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validated = realtimeMetricsQuerySchema.parse(req.query)
  const { domain } = validated

  // Check cache
  const now = Date.now()
  if (cache && now - cache.timestamp < CACHE_DURATION && !domain) {
    res.setHeader('X-Cache', 'HIT')
    return successResponse(res, cache.data)
  }

  const last24h = subHours(new Date(), 24)
  const last5min = subHours(new Date(), 1 / 12) // 5 minutes

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: last24h,
    },
  }

  const recentWhereClause: any = {
    createdAt: {
      gte: last5min,
    },
  }

  // Filter by domain if specified
  if (domain) {
    const domainFilter = {
      url: {
        host: {
          host: domain,
        },
      },
    }
    whereClause.url = domainFilter.url
    recentWhereClause.url = domainFilter.url
  }

  // Parallel queries for better performance
  const [
    pageviewsLast24h,
    uniqueVisitorsLast24h,
    activeVisitors,
    topPagesData,
    recentPageviewsData,
  ] = await Promise.all([
    // Total pageviews last 24h
    prisma.pageView.count({
      where: whereClause,
    }),

    // Unique visitors last 24h (by IP)
    prisma.pageView.groupBy({
      by: ['ip'],
      where: whereClause,
    }).then((result) => result.length),

    // Active visitors (last 5 minutes)
    prisma.pageView.groupBy({
      by: ['ip'],
      where: recentWhereClause,
    }).then((result) => result.length),

    // Top pages last 24h
    prisma.pageView.groupBy({
      by: ['urlId'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }),

    // Recent pageviews
    prisma.pageView.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        url: {
          select: {
            url: true,
          },
        },
        country: {
          select: {
            country: true,
          },
        },
        ua: {
          select: {
            browser: true,
          },
        },
      },
    }),
  ])

  // Get URL details for top pages
  const urlIds = topPagesData.map((p) => p.urlId)
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

  const urlMap = new Map(urls.map((u) => [u.id, u.url]))

  // Format top pages
  const topPages = topPagesData.map((page) => ({
    url: urlMap.get(page.urlId) || 'Unknown',
    count: page._count.id,
  }))

  // Format recent pageviews
  const recentPageviews = recentPageviewsData.map((pv) => ({
    url: pv.url.url,
    country: pv.country?.country || 'Unknown',
    timestamp: pv.createdAt.toISOString(),
    browser: pv.ua?.browser || 'Unknown',
  }))

  const metrics: RealtimeMetrics = {
    activeVisitors,
    pageviewsLast24h,
    uniqueVisitorsLast24h,
    topPages,
    recentPageviews,
  }

  // Update cache if not filtering by domain
  if (!domain) {
    cache = {
      data: metrics,
      timestamp: now,
    }
  }

  res.setHeader('X-Cache', 'MISS')
  res.setHeader('Cache-Control', 'public, max-age=30')

  return successResponse(res, metrics)
}

/**
 * Export API handler
 */
export default createApiHandler({
  GET: getHandler,
})
