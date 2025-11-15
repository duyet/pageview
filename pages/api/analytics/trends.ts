// @ts-nocheck - Legacy endpoint, use /api/v1/analytics/trends instead
import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import prisma from '../../../lib/prisma'

export type TrendData = {
  date: string
  pageviews: number
  uniqueVisitors: number
}

type ResponseData = {
  trends: TrendData[]
  totalPageviews: number
  totalUniqueVisitors: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { days = '30', host } = req.query
    const numDays = parseInt(days as string, 10)

    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({ error: 'Invalid days parameter (1-365)' })
    }

    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, numDays - 1))

    // Build query conditions
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Filter by host if specified
    if (host && typeof host === 'string') {
      whereClause.url = {
        host: {
          host: host,
        },
      }
    }

    // Optimize: Use raw SQL with date truncation and CTE to combine queries
    let dailyStats: Array<{
      date: Date
      pageviews: bigint
      uniqueVisitors: bigint
    }>

    if (host && typeof host === 'string') {
      // With host filter
      dailyStats = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', pv."createdAt") as date,
          COUNT(*) as pageviews,
          COUNT(DISTINCT pv.ip) as "uniqueVisitors"
        FROM "PageView" pv
        INNER JOIN "Url" u ON pv."urlId" = u.id
        INNER JOIN "Host" h ON u."hostId" = h.id
        WHERE pv."createdAt" >= ${startDate}
          AND pv."createdAt" <= ${endDate}
          AND h.host = ${host}
        GROUP BY DATE_TRUNC('day', pv."createdAt")
        ORDER BY date ASC
      `
    } else {
      // Without host filter
      dailyStats = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as pageviews,
          COUNT(DISTINCT ip) as "uniqueVisitors"
        FROM "PageView"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `
    }

    // Create maps for quick lookup
    const pageviewMap = new Map<string, number>()
    const visitorMap = new Map<string, number>()

    dailyStats.forEach((item) => {
      const date = format(new Date(item.date), 'yyyy-MM-dd')
      pageviewMap.set(date, Number(item.pageviews))
      visitorMap.set(date, Number(item.uniqueVisitors))
    })

    // Generate complete date range with zero-filled missing days
    const trends: TrendData[] = []
    let totalPageviews = 0
    let totalUniqueVisitors = 0

    for (let i = 0; i < numDays; i++) {
      const date = format(subDays(endDate, numDays - 1 - i), 'yyyy-MM-dd')
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

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json({
      trends,
      totalPageviews,
      totalUniqueVisitors,
    })
  } catch (error) {
    console.error('Analytics trends error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
