// @ts-nocheck
/**
 * GET /api/v1/analytics/locations
 * Get geographic analytics (countries and cities)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { subDays } from 'date-fns'
import { createApiHandler } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { analyticsLocationsQuerySchema } from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'
import type { LocationAnalytics } from '@/types/api'

/**
 * GET handler
 */
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validated = analyticsLocationsQuerySchema.parse(req.query)
  const { days = 30, domain, type = 'country' } = validated

  const startDate = subDays(new Date(), days)

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: startDate,
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

  // Calculate total for percentages
  const total = await prisma.pageView.count({
    where: whereClause,
  })

  if (type === 'country') {
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
      take: 50,
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

    const countryMap = new Map(countries.map((c) => [c.id, c.country]))

    // Build response
    const locations: LocationAnalytics[] = countryStats
      .filter((stat) => stat.countryId)
      .map((stat) => ({
        country: countryMap.get(stat.countryId!) || 'Unknown',
        countryName: countryMap.get(stat.countryId!) || 'Unknown',
        count: stat._count.id,
        percentage:
          total > 0 ? Math.round((stat._count.id / total) * 1000) / 10 : 0,
      }))

    return successResponse(res, {
      countries: locations,
      total,
    })
  } else {
    // Get city statistics
    const cityStats = await prisma.pageView.groupBy({
      by: ['cityId', 'countryId'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 50,
    })

    // Get city and country details
    const cityIds = cityStats.map((s) => s.cityId).filter(Boolean) as number[]

    const countryIds = cityStats
      .map((s) => s.countryId)
      .filter(Boolean) as number[]

    const [cities, countries] = await Promise.all([
      prisma.city.findMany({
        where: {
          id: {
            in: cityIds,
          },
        },
        select: {
          id: true,
          city: true,
        },
      }),
      prisma.country.findMany({
        where: {
          id: {
            in: countryIds,
          },
        },
        select: {
          id: true,
          country: true,
        },
      }),
    ])

    const cityMap = new Map(cities.map((c) => [c.id, c.city]))
    const countryMap = new Map(countries.map((c) => [c.id, c.country]))

    // Build response
    const locations: LocationAnalytics[] = cityStats
      .filter((stat) => stat.cityId && stat.countryId)
      .map((stat) => ({
        country: countryMap.get(stat.countryId!) || 'Unknown',
        countryName: countryMap.get(stat.countryId!) || 'Unknown',
        city: cityMap.get(stat.cityId!) || 'Unknown',
        count: stat._count.id,
        percentage:
          total > 0 ? Math.round((stat._count.id / total) * 1000) / 10 : 0,
      }))

    return successResponse(res, {
      cities: locations,
      total,
    })
  }
}

/**
 * Export API handler
 */
export default createApiHandler({
  GET: getHandler,
})
