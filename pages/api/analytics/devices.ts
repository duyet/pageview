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

// In-memory cache with 5-minute TTL (max 100 entries)
const cache = new Map<string, { data: ResponseData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX_SIZE = 100

function toDeviceDataArray(
  map: Map<string, number>,
  total: number
): DeviceData[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name: name || 'Unknown',
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
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

    // Check in-memory cache
    const cacheKey = `devices:${numDays}:${host || ''}:${urlId || ''}:${excludeBots || ''}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      )
      return res.status(200).json(cached.data)
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
        return res.status(200).json({
          browsers: [],
          os: [],
          devices: [],
          total: 0,
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

    // Fetch top UA IDs by pageview count and total count in parallel
    const [uaStats, total] = await Promise.all([
      prisma.pageView.groupBy({
        by: ['uAId'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 50,
      }),
      prisma.pageView.count({ where: whereClause }),
    ])

    // Fetch UA details for all unique UA IDs
    const uaIds = uaStats.map((s) => s.uAId).filter(Boolean) as number[]
    const uaDetails = await prisma.uA.findMany({
      where: { id: { in: uaIds } },
      select: { id: true, browser: true, os: true, device: true, deviceType: true },
    })
    const uaMap = new Map(uaDetails.map((ua) => [ua.id, ua]))

    // Process all three maps in a single pass over uaStats
    const browserMap = new Map<string, number>()
    const osMap = new Map<string, number>()
    const deviceMap = new Map<string, number>()

    for (const stat of uaStats) {
      if (!stat.uAId) continue
      const ua = uaMap.get(stat.uAId)
      if (!ua) continue

      if (ua.browser && ua.browser !== '') {
        browserMap.set(
          ua.browser,
          (browserMap.get(ua.browser) || 0) + stat._count.id
        )
      }
      if (ua.os && ua.os !== '') {
        osMap.set(ua.os, (osMap.get(ua.os) || 0) + stat._count.id)
      }
      if (ua.deviceType && ua.deviceType !== '') {
        deviceMap.set(
          ua.deviceType,
          (deviceMap.get(ua.deviceType) || 0) + stat._count.id
        )
      }
    }

    const responseData: ResponseData = {
      browsers: toDeviceDataArray(browserMap, total),
      os: toDeviceDataArray(osMap, total),
      devices: toDeviceDataArray(deviceMap, total),
      total,
    }

    // Evict expired entries before storing
    if (cache.size >= CACHE_MAX_SIZE) {
      const now = Date.now()
      for (const [key, entry] of cache) {
        if (now - entry.timestamp >= CACHE_TTL) cache.delete(key)
      }
      // If still at capacity, clear oldest half
      if (cache.size >= CACHE_MAX_SIZE) {
        const keys = Array.from(cache.keys())
        for (let i = 0; i < keys.length / 2; i++) cache.delete(keys[i])
      }
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json(responseData)
  } catch (error) {
    console.error('Analytics devices error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
