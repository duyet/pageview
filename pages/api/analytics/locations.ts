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
    const { days = '30', host } = req.query
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

    // Filter by host if specified
    if (host && typeof host === 'string') {
      whereClause.url = {
        host: {
          host: host,
        },
      }
    }

    // Get country statistics
    const countryStats = await prisma.pageView.groupBy({
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
      take: 15, // Top 15 countries
    })

    // Get city statistics
    const cityStats = await prisma.pageView.groupBy({
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
      take: 15, // Top 15 cities
    })

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

    // Calculate total for percentages
    const total = await prisma.pageView.count({
      where: whereClause,
    })

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
