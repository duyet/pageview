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

    // Optimize: Use raw SQL with JOINs to get all location stats efficiently
    let countryStatsRaw: Array<{ country: string; count: bigint }>
    let cityStatsRaw: Array<{ city: string; count: bigint }>
    let total: number

    if (host && typeof host === 'string') {
      // With host filter - run queries in parallel
      const [countryResults, cityResults, totalResult] = await Promise.all([
        prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
          SELECT c.country, COUNT(*) as count
          FROM "PageView" pv
          INNER JOIN "Country" c ON pv."countryId" = c.id
          INNER JOIN "Url" u ON pv."urlId" = u.id
          INNER JOIN "Host" h ON u."hostId" = h.id
          WHERE pv."createdAt" >= ${startDate}
            AND h.host = ${host}
          GROUP BY c.country
          ORDER BY count DESC
          LIMIT 15
        `,
        prisma.$queryRaw<Array<{ city: string; count: bigint }>>`
          SELECT ci.city, COUNT(*) as count
          FROM "PageView" pv
          INNER JOIN "City" ci ON pv."cityId" = ci.id
          INNER JOIN "Url" u ON pv."urlId" = u.id
          INNER JOIN "Host" h ON u."hostId" = h.id
          WHERE pv."createdAt" >= ${startDate}
            AND h.host = ${host}
          GROUP BY ci.city
          ORDER BY count DESC
          LIMIT 15
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM "PageView" pv
          INNER JOIN "Url" u ON pv."urlId" = u.id
          INNER JOIN "Host" h ON u."hostId" = h.id
          WHERE pv."createdAt" >= ${startDate}
            AND h.host = ${host}
        `,
      ])
      countryStatsRaw = countryResults
      cityStatsRaw = cityResults
      total = Number(totalResult[0]?.count || 0)
    } else {
      // Without host filter - run queries in parallel
      const [countryResults, cityResults, totalResult] = await Promise.all([
        prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
          SELECT c.country, COUNT(*) as count
          FROM "PageView" pv
          INNER JOIN "Country" c ON pv."countryId" = c.id
          WHERE pv."createdAt" >= ${startDate}
          GROUP BY c.country
          ORDER BY count DESC
          LIMIT 15
        `,
        prisma.$queryRaw<Array<{ city: string; count: bigint }>>`
          SELECT ci.city, COUNT(*) as count
          FROM "PageView" pv
          INNER JOIN "City" ci ON pv."cityId" = ci.id
          WHERE pv."createdAt" >= ${startDate}
          GROUP BY ci.city
          ORDER BY count DESC
          LIMIT 15
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM "PageView"
          WHERE "createdAt" >= ${startDate}
        `,
      ])
      countryStatsRaw = countryResults
      cityStatsRaw = cityResults
      total = Number(totalResult[0]?.count || 0)
    }

    // Process country data directly
    const countryData: LocationData[] = countryStatsRaw.map((stat) => {
      const value = Number(stat.count)
      return {
        name: stat.country || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }
    })

    // Process city data directly
    const cityData: LocationData[] = cityStatsRaw.map((stat) => {
      const value = Number(stat.count)
      return {
        name: stat.city || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }
    })

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
