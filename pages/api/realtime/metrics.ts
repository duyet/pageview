// @ts-nocheck - Legacy endpoint with type issues
import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subHours, startOfHour } from 'date-fns'
import prisma from '../../../lib/prisma'
import { RealtimeMetrics } from '../../../types/socket'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealtimeMetrics | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const last24Hours = subHours(now, 24)
    const last1Hour = subHours(now, 1)

    // Get total views in last 24 hours
    const totalViews = await prisma.pageView.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    })

    // Get unique visitors in last 24 hours (by IP)
    const uniqueVisitors = await prisma.pageView.groupBy({
      by: ['ip'],
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
      _count: {
        ip: true,
      },
    })

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

    // Get hourly views for last 24 hours
    const hourlyViews = await prisma.pageView.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Process hourly data
    const hourlyMap = new Map<string, number>()

    hourlyViews.forEach((item) => {
      const hour = format(startOfHour(item.createdAt), 'yyyy-MM-dd HH:00')
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + item._count.id)
    })

    // Generate complete 24-hour range
    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(now, i))
      const hourKey = format(hour, 'yyyy-MM-dd HH:00')
      const hourLabel = format(hour, 'HH:00')

      hourlyData.push({
        hour: hourLabel,
        views: hourlyMap.get(hourKey) || 0,
      })
    }

    const metrics: RealtimeMetrics = {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      activePages: activePagesData,
      recentCountries: recentCountriesData,
      hourlyViews: hourlyData,
    }

    res.status(200).json(metrics)
  } catch (error) {
    console.error('Realtime metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
