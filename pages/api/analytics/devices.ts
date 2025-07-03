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

    // Get browser statistics
    const browserStats = await prisma.pageView.groupBy({
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
      take: 10, // Top 10 browsers
    })

    // Get OS statistics
    const osStats = await prisma.pageView.groupBy({
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
      take: 10, // Top 10 OS
    })

    // Get device type statistics
    const deviceStats = await prisma.pageView.groupBy({
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
      take: 10, // Top 10 devices
    })

    // Get UA details for browsers
    const allUaIds = [
      ...browserStats.map((s) => s.uAId),
      ...osStats.map((s) => s.uAId),
      ...deviceStats.map((s) => s.uAId),
    ].filter(Boolean) as number[]

    const uaIds = Array.from(new Set(allUaIds))

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
    browserStats.forEach((stat) => {
      if (stat.uAId) {
        const ua = uaMap.get(stat.uAId)
        if (ua?.browser) {
          const browser = ua.browser
          browserMap.set(
            browser,
            (browserMap.get(browser) || 0) + stat._count.id
          )
        }
      }
    })

    // Process OS data
    const osMap = new Map<string, number>()
    osStats.forEach((stat) => {
      if (stat.uAId) {
        const ua = uaMap.get(stat.uAId)
        if (ua?.os) {
          const os = ua.os
          osMap.set(os, (osMap.get(os) || 0) + stat._count.id)
        }
      }
    })

    // Process device data
    const deviceMap = new Map<string, number>()
    deviceStats.forEach((stat) => {
      if (stat.uAId) {
        const ua = uaMap.get(stat.uAId)
        if (ua?.deviceType) {
          const device = ua.deviceType
          deviceMap.set(device, (deviceMap.get(device) || 0) + stat._count.id)
        }
      }
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
