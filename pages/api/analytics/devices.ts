// @ts-nocheck - Legacy endpoint, use /api/v1/analytics/devices instead
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export type DeviceData = {
  name: string
  value: number
  percentage: number
}

type ResponseData = {
  browsers: DeviceData[]
  os: DeviceData[]
  devices: DeviceData[]
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

    // Optimize: Use raw SQL with JOINs to get all stats in fewer queries
    let browserStatsRaw: Array<{ browser: string; count: bigint }>
    let osStatsRaw: Array<{ os: string; count: bigint }>
    let deviceStatsRaw: Array<{ deviceType: string; count: bigint }>
    let total: number

    if (host && typeof host === 'string') {
      // With host filter - run queries in parallel
      const [browserResults, osResults, deviceResults, totalResult] =
        await Promise.all([
          prisma.$queryRaw<Array<{ browser: string; count: bigint }>>`
            SELECT ua.browser, COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            INNER JOIN "Url" u ON pv."urlId" = u.id
            INNER JOIN "Host" h ON u."hostId" = h.id
            WHERE pv."createdAt" >= ${startDate}
              AND h.host = ${host}
              AND ua.browser IS NOT NULL
              AND ua.browser != ''
            GROUP BY ua.browser
            ORDER BY count DESC
            LIMIT 10
          `,
          prisma.$queryRaw<Array<{ os: string; count: bigint }>>`
            SELECT ua.os, COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            INNER JOIN "Url" u ON pv."urlId" = u.id
            INNER JOIN "Host" h ON u."hostId" = h.id
            WHERE pv."createdAt" >= ${startDate}
              AND h.host = ${host}
              AND ua.os IS NOT NULL
              AND ua.os != ''
            GROUP BY ua.os
            ORDER BY count DESC
            LIMIT 10
          `,
          prisma.$queryRaw<Array<{ deviceType: string; count: bigint }>>`
            SELECT ua."deviceType", COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            INNER JOIN "Url" u ON pv."urlId" = u.id
            INNER JOIN "Host" h ON u."hostId" = h.id
            WHERE pv."createdAt" >= ${startDate}
              AND h.host = ${host}
              AND ua."deviceType" IS NOT NULL
              AND ua."deviceType" != ''
            GROUP BY ua."deviceType"
            ORDER BY count DESC
            LIMIT 10
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
      browserStatsRaw = browserResults
      osStatsRaw = osResults
      deviceStatsRaw = deviceResults
      total = Number(totalResult[0]?.count || 0)
    } else {
      // Without host filter - run queries in parallel
      const [browserResults, osResults, deviceResults, totalResult] =
        await Promise.all([
          prisma.$queryRaw<Array<{ browser: string; count: bigint }>>`
            SELECT ua.browser, COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            WHERE pv."createdAt" >= ${startDate}
              AND ua.browser IS NOT NULL
              AND ua.browser != ''
            GROUP BY ua.browser
            ORDER BY count DESC
            LIMIT 10
          `,
          prisma.$queryRaw<Array<{ os: string; count: bigint }>>`
            SELECT ua.os, COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            WHERE pv."createdAt" >= ${startDate}
              AND ua.os IS NOT NULL
              AND ua.os != ''
            GROUP BY ua.os
            ORDER BY count DESC
            LIMIT 10
          `,
          prisma.$queryRaw<Array<{ deviceType: string; count: bigint }>>`
            SELECT ua."deviceType", COUNT(*) as count
            FROM "PageView" pv
            INNER JOIN "UA" ua ON pv."uAId" = ua.id
            WHERE pv."createdAt" >= ${startDate}
              AND ua."deviceType" IS NOT NULL
              AND ua."deviceType" != ''
            GROUP BY ua."deviceType"
            ORDER BY count DESC
            LIMIT 10
          `,
          prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM "PageView"
            WHERE "createdAt" >= ${startDate}
          `,
        ])
      browserStatsRaw = browserResults
      osStatsRaw = osResults
      deviceStatsRaw = deviceResults
      total = Number(totalResult[0]?.count || 0)
    }

    // Convert results directly to maps
    const browserMap = new Map<string, number>()
    browserStatsRaw.forEach((stat) => {
      browserMap.set(stat.browser, Number(stat.count))
    })

    const osMap = new Map<string, number>()
    osStatsRaw.forEach((stat) => {
      osMap.set(stat.os, Number(stat.count))
    })

    const deviceMap = new Map<string, number>()
    deviceStatsRaw.forEach((stat) => {
      deviceMap.set(stat.deviceType, Number(stat.count))
    })

    // Convert to arrays with percentages
    const browsers: DeviceData[] = Array.from(browserMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))

    const os: DeviceData[] = Array.from(osMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))

    const devices: DeviceData[] = Array.from(deviceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json({
      browsers,
      os,
      devices,
      total,
    })
  } catch (error) {
    console.error('Analytics devices error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
