// @ts-nocheck - Legacy endpoint, use /api/v1/analytics/trends instead
import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import prisma from '../../../lib/prisma'

// In-memory cache with 5-min TTL (matches Cache-Control s-maxage=300)
const cache = new Map<string, { data: ResponseData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

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
    const { days = '30', host, urlId, excludeBots } = req.query
    const numDays = parseInt(days as string, 10)

    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({ error: 'Invalid days parameter (1-365)' })
    }

    // Check cache
    const cacheKey = `trends:${numDays}:${host || ''}:${urlId || ''}:${excludeBots || ''}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      )
      return res.status(200).json(cached.data)
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

    // Filter by URL ID if specified (takes precedence over host)
    if (urlId && typeof urlId === 'string') {
      whereClause.urlId = parseInt(urlId, 10)
    }
    // Filter by host if specified
    // Note: Prisma groupBy may not support nested relation filters in where clause,
    // so we need to first find matching URL IDs and then filter by those
    else if (host && typeof host === 'string') {
      const matchingUrls = await prisma.url.findMany({
        where: {
          host: {
            host: host,
          },
        },
        select: {
          id: true,
        },
      })

      const urlIds = matchingUrls.map((u) => u.id)

      if (urlIds.length === 0) {
        // No matching URLs found, return empty results
        return res.status(200).json({
          trends: [],
          totalPageviews: 0,
          totalUniqueVisitors: 0,
        })
      }

      whereClause.urlId = {
        in: urlIds,
      }
    }

    // Filter out bots if requested
    if (excludeBots === 'true') {
      whereClause.ua = {
        isBot: false,
      }
    }

    // Get daily pageviews and unique visitors using Prisma
    const [dailyPageviews, uniqueIpsByDay, allUniqueIps] = await Promise.all([
      // Get daily pageview counts
      prisma.pageView.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      // Get unique IPs by day for daily unique visitor count
      prisma.pageView.groupBy({
        by: ['createdAt', 'ip'],
        where: {
          ...whereClause,
          ip: {
            not: null,
            notIn: [''],
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      // Count unique IPs across the date range for total unique visitors
      prisma.pageView.groupBy({
        by: ['ip'],
        where: {
          ...whereClause,
          ip: {
            not: null,
            notIn: [''],
          },
        },
      }),
    ])

    // Create maps for quick lookup
    const pageviewMap = new Map<string, number>()
    const visitorMap = new Map<string, Set<string>>()

    // Process pageviews
    dailyPageviews.forEach((item) => {
      const date = format(startOfDay(item.createdAt), 'yyyy-MM-dd')
      pageviewMap.set(date, (pageviewMap.get(date) || 0) + item._count.id)
    })

    // Process unique visitors by day
    uniqueIpsByDay.forEach((item) => {
      const date = format(startOfDay(item.createdAt), 'yyyy-MM-dd')
      if (!visitorMap.has(date)) {
        visitorMap.set(date, new Set())
      }
      if (item.ip) {
        visitorMap.get(date)!.add(item.ip)
      }
    })

    // Generate complete date range with zero-filled missing days
    const trends: TrendData[] = []
    let totalPageviews = 0

    for (let i = 0; i < numDays; i++) {
      const date = format(subDays(endDate, numDays - 1 - i), 'yyyy-MM-dd')
      const pageviewsCount = pageviewMap.get(date) || 0
      const uniqueVisitorsCount = visitorMap.get(date)?.size || 0

      trends.push({
        date,
        pageviews: pageviewsCount,
        uniqueVisitors: uniqueVisitorsCount,
      })

      totalPageviews += pageviewsCount
    }

    // Total unique visitors is count of distinct IPs across entire period
    const totalUniqueVisitors = allUniqueIps.length

    const responseData: ResponseData = {
      trends,
      totalPageviews,
      totalUniqueVisitors,
    }

    // Update cache
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json(responseData)
  } catch (error) {
    console.error('Analytics trends error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
