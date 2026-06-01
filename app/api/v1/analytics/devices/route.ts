/**
 * GET /api/v1/analytics/devices
 * Get device, browser, and OS analytics
 */

import { subDays } from 'date-fns'
import { successResponse } from '@/lib/api/app-response'
import { analyticsDevicesQuerySchema } from '@/lib/validation/schemas'
import prisma from '@/lib/prisma'
import type { DeviceAnalytics } from '@/types/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = Object.fromEntries(searchParams.entries())

  // Validate query parameters
  const validated = analyticsDevicesQuerySchema.parse(query)
  const { days = 30, domain, type } = validated

  const startDate = subDays(new Date(), days)

  // Build where clause
  const whereClause: any = {
    createdAt: {
      gte: startDate,
    },
  }

  if (domain) {
    whereClause.url = {
      host: {
        host: domain,
      },
    }
  }

  // Get user agent statistics
  const uaStats = await prisma.pageView.groupBy({
    by: ['uAId'],
    where: whereClause,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  })

  // Get UA details
  const uaIds = uaStats.map((s) => s.uAId).filter(Boolean) as number[]

  const uaDetails = await prisma.uA.findMany({
    where: {
      id: {
        in: uaIds,
      },
    },
    select: {
      id: true,
      browser: true,
      os: true,
      device: true,
      deviceType: true,
    },
  })

  const uaMap = new Map(uaDetails.map((ua) => [ua.id, ua]))

  // Calculate total for percentages
  const total = await prisma.pageView.count({
    where: whereClause,
  })

  // Process browser data
  const browserMap = new Map<string, number>()
  const osMap = new Map<string, number>()
  const deviceMap = new Map<string, number>()

  uaStats.forEach((stat) => {
    if (stat.uAId) {
      const ua = uaMap.get(stat.uAId)
      if (ua) {
        if (ua.browser) {
          browserMap.set(
            ua.browser,
            (browserMap.get(ua.browser) || 0) + stat._count.id
          )
        }
        if (ua.os) {
          osMap.set(ua.os, (osMap.get(ua.os) || 0) + stat._count.id)
        }
        if (ua.deviceType) {
          deviceMap.set(
            ua.deviceType,
            (deviceMap.get(ua.deviceType) || 0) + stat._count.id
          )
        }
      }
    }
  })

  // Convert to arrays with percentages
  const toDeviceAnalytics = (map: Map<string, number>): DeviceAnalytics[] =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        browser: name,
        os: name,
        device: name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))

  const browsers = toDeviceAnalytics(browserMap).map((item) => ({
    ...item,
    browser: item.os,
    os: '',
    device: '',
  }))

  const operatingSystems = toDeviceAnalytics(osMap).map((item) => ({
    ...item,
    browser: '',
  }))

  const devices = toDeviceAnalytics(deviceMap).map((item) => ({
    ...item,
    browser: '',
    os: '',
  }))

  const cacheHeaders = {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  }

  if (type === 'browser') {
    return successResponse({ browsers, total }, 200, cacheHeaders)
  } else if (type === 'os') {
    return successResponse({ operatingSystems, total }, 200, cacheHeaders)
  } else if (type === 'device') {
    return successResponse({ devices, total }, 200, cacheHeaders)
  }

  return successResponse(
    { browsers, operatingSystems, devices, total },
    200,
    cacheHeaders
  )
}
