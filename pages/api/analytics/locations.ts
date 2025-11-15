// @ts-nocheck - Legacy endpoint, use /api/v1/analytics/locations instead
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export type LocationData = {
  name: string
  value: number
  percentage: number
}

type ResponseData = {
  countries: LocationData[]
  cities: LocationData[]
  total: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { days = '30', host, urlId } = req.query
    const numDays = parseInt(days as string, 10)

    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({ error: 'Invalid days parameter (1-365)' })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - numDays)

    // Build query conditions
    const whereClause: any = {
      createdAt: {
        gte: startDate,
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
          countries: [],
          cities: [],
          total: 0,
        })
      }

      whereClause.urlId = {
        in: urlIds,
      }
    }

    // Get country and city statistics using Prisma
    const [countryStats, cityStats, total] = await Promise.all([
      // Country statistics
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
        take: 15,
      }),
      // City statistics
      prisma.pageView.groupBy({
        by: ['cityId'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 15,
      }),
      // Total count
      prisma.pageView.count({
        where: whereClause,
      }),
    ])

    // Get country details
    const countryIds = countryStats
      .map((s) => s.countryId)
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

    // Get city details
    const cityIds = cityStats.map((s) => s.cityId).filter(Boolean) as number[]

    const cities = await prisma.city.findMany({
      where: {
        id: {
          in: cityIds,
        },
      },
      select: {
        id: true,
        city: true,
      },
    })

    const countryMap = new Map(countries.map((c) => [c.id, c.country]))
    const cityMap = new Map(cities.map((c) => [c.id, c.city]))

    // Process country data
    const countryData: LocationData[] = countryStats
      .filter((stat) => stat.countryId && countryMap.has(stat.countryId))
      .map((stat) => ({
        name: countryMap.get(stat.countryId!) || 'Unknown',
        value: stat._count.id,
        percentage: total > 0 ? Math.round((stat._count.id / total) * 100) : 0,
      }))

    // Process city data
    const cityData: LocationData[] = cityStats
      .filter((stat) => stat.cityId && cityMap.has(stat.cityId))
      .map((stat) => ({
        name: cityMap.get(stat.cityId!) || 'Unknown',
        value: stat._count.id,
        percentage: total > 0 ? Math.round((stat._count.id / total) * 100) : 0,
      }))

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json({
      countries: countryData,
      cities: cityData,
      total,
    })
  } catch (error) {
    console.error('Analytics locations error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
