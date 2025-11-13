/**
 * GET /api/v1/analytics/domains/[domain]
 * Get analytics for a specific domain
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { subDays } from 'date-fns'
import { createApiHandler } from '@/lib/api/middleware'
import { successResponse, notFoundResponse } from '@/lib/api/response'
import { analyticsDomainQuerySchema, analyticsDomainParamsSchema } from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'

/**
 * GET handler
 */
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate parameters
  const { domain } = analyticsDomainParamsSchema.parse(req.query)
  const validated = analyticsDomainQuerySchema.parse(req.query)
  const { days = 30, page = 1, pageSize = 50 } = validated

  // Check if domain exists
  const host = await prisma.host.findUnique({
    where: { host: domain },
    select: { id: true },
  })

  if (!host) {
    return notFoundResponse(res, 'Domain')
  }

  const startDate = days ? subDays(new Date(), days) : undefined

  // Build where clause
  const whereClause: any = {
    url: {
      host: {
        id: host.id,
      },
    },
  }

  if (startDate) {
    whereClause.createdAt = {
      gte: startDate,
    }
  }

  // Get URL statistics for this domain
  const urls = await prisma.url.findMany({
    where: {
      hostId: host.id,
    },
    select: {
      id: true,
      url: true,
      slug: {
        select: {
          slug: true,
        },
      },
      pageViews: {
        where: startDate
          ? {
              createdAt: {
                gte: startDate,
              },
            }
          : undefined,
        select: {
          id: true,
          createdAt: true,
          ip: true,
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Calculate statistics for each URL
  const urlStats = urls.map((url) => ({
    id: url.id,
    url: url.url,
    path: url.slug.slug,
    totalPageviews: url.pageViews.length,
    uniqueVisitors: new Set(url.pageViews.map((pv) => pv.ip)).size,
    lastPageview: url.pageViews[0]?.createdAt.toISOString(),
  }))

  // Sort by pageviews
  urlStats.sort((a, b) => b.totalPageviews - a.totalPageviews)

  // Get domain totals
  const [totalPageviews, totalUrls] = await Promise.all([
    prisma.pageView.count({ where: whereClause }),
    prisma.url.count({ where: { hostId: host.id } }),
  ])

  const uniqueVisitors = await prisma.pageView
    .groupBy({
      by: ['ip'],
      where: whereClause,
    })
    .then((result) => result.length)

  return successResponse(res, {
    domain,
    summary: {
      totalPageviews,
      uniqueVisitors,
      totalUrls,
    },
    urls: urlStats,
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
