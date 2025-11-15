import type { NextApiRequest, NextApiResponse } from 'next'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import prisma from '../../../lib/prisma'
import { getBotTypeDescription } from '../../../lib/botDetection'

export type BotData = {
  botType: string
  botName: string | null
  count: number
  percentage: number
}

export type BotStatsData = {
  totalBots: number
  totalHumans: number
  totalPageviews: number
  botPercentage: number
  humanPercentage: number
  botsByType: BotData[]
  topBots: BotData[]
}

type ResponseData = BotStatsData | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
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

    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, numDays - 1))

    // Build query conditions
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
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

    // Get total pageviews and bot/human breakdown
    const [totalPageviews, botPageviews, humanPageviews] = await Promise.all([
      prisma.pageView.count({
        where: whereClause,
      }),
      prisma.pageView.count({
        where: {
          ...whereClause,
          ua: {
            isBot: true,
          },
        },
      }),
      prisma.pageView.count({
        where: {
          ...whereClause,
          ua: {
            isBot: false,
          },
        },
      }),
    ])

    // Get bot traffic grouped by bot type
    const botsByTypeRaw = await prisma.pageView.groupBy({
      by: ['uAId'],
      where: {
        ...whereClause,
        ua: {
          isBot: true,
          botType: {
            not: null,
          },
        },
      },
      _count: {
        id: true,
      },
    })

    // Fetch UA details for bot types
    const uaIds = botsByTypeRaw
      .map((b: { uAId: number | null; _count: { id: number } }) => b.uAId)
      .filter((id: number | null): id is number => id !== null)
    const uaDetails = await prisma.uA.findMany({
      where: {
        id: {
          in: uaIds,
        },
      },
      select: {
        id: true,
        botType: true,
        botName: true,
      },
    })

    // Create a map for quick lookup
    type UADetail = {
      id: number
      botType: string | null
      botName: string | null
    }
    const uaMap = new Map<number, UADetail>(
      uaDetails.map((ua: UADetail) => [ua.id, ua])
    )

    // Aggregate by bot type
    const botTypeMap = new Map<string, number>()
    const botNameMap = new Map<string, { botType: string; count: number }>()

    botsByTypeRaw.forEach(
      (item: { uAId: number | null; _count: { id: number } }) => {
        if (!item.uAId) return
        const ua = uaMap.get(item.uAId)
        if (!ua || !ua.botType) return

        // Aggregate by type
        const currentTypeCount = botTypeMap.get(ua.botType) || 0
        botTypeMap.set(ua.botType, currentTypeCount + item._count.id)

        // Aggregate by bot name
        if (ua.botName) {
          const key = `${ua.botType}:${ua.botName}`
          const current = botNameMap.get(key) || {
            botType: ua.botType,
            count: 0,
          }
          botNameMap.set(key, {
            ...current,
            count: current.count + item._count.id,
          })
        }
      }
    )

    // Format bot types data
    const botsByType: BotData[] = Array.from(botTypeMap.entries())
      .map(([botType, count]) => ({
        botType: getBotTypeDescription(botType),
        botName: null,
        count,
        percentage: totalPageviews > 0 ? (count / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Format top bots data
    const topBots: BotData[] = Array.from(botNameMap.entries())
      .map(([key, data]) => ({
        botType: getBotTypeDescription(data.botType),
        botName: key.split(':')[1],
        count: data.count,
        percentage:
          totalPageviews > 0 ? (data.count / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const botPercentage =
      totalPageviews > 0 ? (botPageviews / totalPageviews) * 100 : 0
    const humanPercentage =
      totalPageviews > 0 ? (humanPageviews / totalPageviews) * 100 : 0

    // Set cache headers for CDN/client-side caching (5 minutes)
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    res.status(200).json({
      totalBots: botPageviews,
      totalHumans: humanPageviews,
      totalPageviews,
      botPercentage,
      humanPercentage,
      botsByType,
      topBots,
    })
  } catch (error) {
    console.error('Bot analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
