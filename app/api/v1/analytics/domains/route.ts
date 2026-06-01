/**
 * GET /api/v1/analytics/domains
 * Get all domains with statistics
 */

import { successResponse } from '@/lib/api/app-response';
import prisma from '@/lib/prisma';
import { analyticsDomainsQuerySchema } from '@/lib/validation/schemas';
import type { DomainStats } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  // Validate query parameters
  const validated = analyticsDomainsQuerySchema.parse(query);
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'pageviews',
    sortOrder = 'desc',
    search,
  } = validated;

  // Build where clause for search
  const whereClause: any = search
    ? {
        host: {
          contains: search,
          mode: 'insensitive',
        },
      }
    : {};

  // Get total count
  const total = await prisma.host.count({
    where: whereClause,
  });

  // Get domains with stats using optimized query
  const hosts = await prisma.host.findMany({
    where: whereClause,
    select: {
      id: true,
      host: true,
      urls: {
        select: {
          id: true,
          pageViews: {
            select: {
              id: true,
              createdAt: true,
              ip: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Calculate statistics for each domain
  const domainStats: DomainStats[] = await Promise.all(
    hosts.map(async (host) => {
      const totalPageviews = await prisma.pageView.count({
        where: {
          url: {
            host: {
              id: host.id,
            },
          },
        },
      });

      const uniqueVisitors = await prisma.pageView
        .groupBy({
          by: ['ip'],
          where: {
            url: {
              host: {
                id: host.id,
              },
            },
          },
        })
        .then((result) => result.length);

      const lastPageview = host.urls
        .flatMap((u) => u.pageViews)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return {
        domain: host.host,
        totalPageviews,
        uniqueVisitors,
        urls: host.urls.length,
        lastPageview: lastPageview?.createdAt.toISOString(),
      };
    }),
  );

  // Sort results
  domainStats.sort((a, b) => {
    const aVal = sortBy === 'pageviews' ? a.totalPageviews : a.uniqueVisitors;
    const bVal = sortBy === 'pageviews' ? b.totalPageviews : b.uniqueVisitors;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const totalPages = Math.ceil(total / pageSize);

  return successResponse(domainStats, 200, {
    meta: {
      page: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  });
}
