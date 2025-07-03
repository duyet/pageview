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

    // Create a map for quick lookup
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
