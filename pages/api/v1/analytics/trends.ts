// @ts-nocheck
/**
 * GET /api/v1/analytics/trends
 * Get pageview trends over time
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { createApiHandler } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { analyticsTrendsQuerySchema } from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'
import type { TrendDataPoint } from '@/types/api'

/**
 * GET handler
 */
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validated = analyticsTrendsQuerySchema.parse(req.query)
  const { days = 30, domain, interval = 'day' } = validated

  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, days - 1))

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  // Filter by domain if specified
  if (domain) {
    whereClause.url = {
      host: {
        host: domain,
      },
    }
  }

  // Get daily pageview counts
  const dailyPageviews = await prisma.pageView.groupBy({
    by: ['createdAt'],
    where: whereClause,
    _count: {
      id: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Get unique daily visitors (by IP)
  const dailyUniqueVisitors = await prisma.pageView.groupBy({
    by: ['createdAt'],
    where: whereClause,
    _count: {
      ip: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Create maps for quick lookup
  const pageviewMap = new Map<string, number>()
  const visitorMap = new Map<string, number>()

  dailyPageviews.forEach((item) => {
    const date = format(item.createdAt, 'yyyy-MM-dd')
    pageviewMap.set(date, (pageviewMap.get(date) || 0) + item._count.id)
  })

  dailyUniqueVisitors.forEach((item) => {
    const date = format(item.createdAt, 'yyyy-MM-dd')
    visitorMap.set(date, (visitorMap.get(date) || 0) + item._count.ip)
  })

  // Generate complete date range with zero-filled missing days
  const trends: TrendDataPoint[] = []
  let totalPageviews = 0
  let totalUniqueVisitors = 0

  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd')
    const pageviews = pageviewMap.get(date) || 0
    const uniqueVisitors = visitorMap.get(date) || 0

    trends.push({
      date,
      pageviews,
      uniqueVisitors,
    })

    totalPageviews += pageviews
    totalUniqueVisitors += uniqueVisitors
  }

  return successResponse(res, {
    trends,
    summary: {
      totalPageviews,
      totalUniqueVisitors,
      avgPageviewsPerDay: Math.round(totalPageviews / days),
      avgUniqueVisitorsPerDay: Math.round(totalUniqueVisitors / days),
    },
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
    },
  })
}

/**
 * Export API handler
 */
export default createApiHandler({
  GET: getHandler,
})
