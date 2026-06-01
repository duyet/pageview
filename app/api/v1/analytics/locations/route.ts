/**
 * GET /api/v1/analytics/locations
 * Get geographic analytics (countries and cities)
 */

import { subDays } from 'date-fns';
import { successResponse } from '@/lib/api/app-response';
import prisma from '@/lib/prisma';
import { analyticsLocationsQuerySchema } from '@/lib/validation/schemas';
import type { LocationAnalytics } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  // Validate query parameters
  const validated = analyticsLocationsQuerySchema.parse(query);
  const { days = 30, domain, type = 'country' } = validated;

  const startDate = subDays(new Date(), days);

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: startDate,
    },
  };

  if (domain) {
    whereClause.url = {
      host: {
        host: domain,
      },
    };
  }

  // Calculate total for percentages
  const total = await prisma.pageView.count({
    where: whereClause,
  });

  const cacheHeaders = {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  };

  if (type === 'country') {
    const countryStats = await prisma.pageView.groupBy({
      by: ['countryId'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    });

    const countryIds = countryStats
      .map((s) => s.countryId)
      .filter(Boolean) as number[];

    const countries = await prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, country: true },
    });

    const countryMap = new Map(countries.map((c) => [c.id, c.country]));

    const locations: LocationAnalytics[] = countryStats
      .filter((stat) => stat.countryId)
      .map((stat) => ({
        country: countryMap.get(stat.countryId!) || 'Unknown',
        countryName: countryMap.get(stat.countryId!) || 'Unknown',
        count: stat._count.id,
        percentage:
          total > 0 ? Math.round((stat._count.id / total) * 1000) / 10 : 0,
      }));

    return successResponse({ countries: locations, total }, 200, cacheHeaders);
  } else {
    const cityStats = await prisma.pageView.groupBy({
      by: ['cityId', 'countryId'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    });

    const cityIds = cityStats.map((s) => s.cityId).filter(Boolean) as number[];
    const countryIds = cityStats
      .map((s) => s.countryId)
      .filter(Boolean) as number[];

    const [cities, countries] = await Promise.all([
      prisma.city.findMany({
        where: { id: { in: cityIds } },
        select: { id: true, city: true },
      }),
      prisma.country.findMany({
        where: { id: { in: countryIds } },
        select: { id: true, country: true },
      }),
    ]);

    const cityMap = new Map(cities.map((c) => [c.id, c.city]));
    const countryMap = new Map(countries.map((c) => [c.id, c.country]));

    const locations: LocationAnalytics[] = cityStats
      .filter((stat) => stat.cityId && stat.countryId)
      .map((stat) => ({
        country: countryMap.get(stat.countryId!) || 'Unknown',
        countryName: countryMap.get(stat.countryId!) || 'Unknown',
        city: cityMap.get(stat.cityId!) || 'Unknown',
        count: stat._count.id,
        percentage:
          total > 0 ? Math.round((stat._count.id / total) * 1000) / 10 : 0,
      }));

    return successResponse({ cities: locations, total }, 200, cacheHeaders);
  }
}
