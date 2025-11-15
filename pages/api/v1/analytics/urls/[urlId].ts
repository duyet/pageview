// @ts-nocheck - Legacy type issues, refactor needed
/**
 * GET /api/v1/analytics/urls/[urlId]
 * Get detailed analytics for a specific URL
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { subDays, format } from 'date-fns'
import { createApiHandler } from '@/lib/api/middleware'
import { successResponse, notFoundResponse } from '@/lib/api/response'
import {
  analyticsUrlParamsSchema,
  analyticsUrlQuerySchema,
} from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'

/**
 * GET handler
 */
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate parameters
  const { urlId } = analyticsUrlParamsSchema.parse(req.query)
  const validated = analyticsUrlQuerySchema.parse(req.query)
  const { days = 30 } = validated

  // Get URL details
  const url = await prisma.url.findUnique({
    where: { id: urlId },
    select: {
      id: true,
      url: true,
      host: {
        select: {
          host: true,
        },
      },
      slug: {
        select: {
          slug: true,
        },
      },
    },
  })

  if (!url) {
    return notFoundResponse(res, 'URL')
  }

  const startDate = days ? subDays(new Date(), days) : undefined

  // Build where clause
  const whereClause: any = {
    urlId: url.id,
  }

  if (startDate) {
    whereClause.createdAt = {
      gte: startDate,
    }
  }

  // Parallel queries for analytics
  const [
    totalPageviews,
    uniqueVisitors,
    pageviews,
    browserStats,
    countryStats,
  ] = await Promise.all([
    // Total pageviews
    prisma.pageView.count({ where: whereClause }),

    // Unique visitors
    prisma.pageView
      .groupBy({
        by: ['ip'],
        where: whereClause,
      })
      .then((result) => result.length),

    // Pageviews over time
    prisma.pageView.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),

    // Browser breakdown
    prisma.pageView.groupBy({
      by: ['uAId'],
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

    // Country breakdown
    prisma.pageView.groupBy({
      by: ['countryId'],
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
  ])

  // Get browser details
  const uaIds = browserStats.map((s) => s.uAId).filter(Boolean) as number[]
  const browsers = await prisma.uA.findMany({
    where: { id: { in: uaIds } },
    select: { id: true, browser: true },
  })
  const browserMap = new Map(browsers.map((b) => [b.id, b.browser]))

  // Get country details
  const countryIds = countryStats
    .map((s) => s.countryId)
    .filter(Boolean) as number[]
  const countries = await prisma.country.findMany({
    where: { id: { in: countryIds } },
    select: { id: true, country: true },
  })
  const countryMap = new Map(countries.map((c) => [c.id, c.country]))

  // Format browser stats
  const topBrowsers = browserStats
    .filter((s) => s.uAId)
    .map((s) => ({
      name: browserMap.get(s.uAId!) || 'Unknown',
      count: s._count.id,
      percentage: Math.round((s._count.id / totalPageviews) * 1000) / 10,
    }))

  // Format country stats
  const topCountries = countryStats
    .filter((s) => s.countryId)
    .map((s) => ({
      name: countryMap.get(s.countryId!) || 'Unknown',
      count: s._count.id,
      percentage: Math.round((s._count.id / totalPageviews) * 1000) / 10,
    }))

  // Daily trend
  const dailyMap = new Map<string, number>()
  pageviews.forEach((pv) => {
    const date = format(pv.createdAt, 'yyyy-MM-dd')
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
  })

  const trends = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, pageviews: count }))

  return successResponse(res, {
    url: {
      id: url.id,
      url: url.url,
      domain: url.host.host,
      path: url.slug.slug,
    },
    summary: {
      totalPageviews,
      uniqueVisitors,
      avgPageviewsPerDay: Math.round(totalPageviews / (days || 30)),
    },
    trends,
    topBrowsers,
    topCountries,
    period: {
      days: days || 'all',
      startDate: startDate?.toISOString(),
    },
  })
}

/**
 * Export API handler
 */
export default createApiHandler({
  GET: getHandler,
})
