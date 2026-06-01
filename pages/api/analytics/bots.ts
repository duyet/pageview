import type { NextApiRequest, NextApiResponse } from 'next'
import { getBotsData, DataSource } from '../../../lib/analytics/dataSourceQuery'

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

const cache = new Map<string, { data: BotStatsData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX = 50

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { days = '30', host, source = 'postgres' } = req.query
    const numDays = parseInt(days as string, 10)

    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({ error: 'Invalid days parameter (1-365)' })
    }

    const activeSource = ['postgres', 'clickhouse', 'duckdb'].includes(
      source as string
    )
      ? (source as DataSource)
      : 'postgres'

    // Separate caches by active source
    const cacheKey = `bots:${numDays}:${host || ''}:${activeSource}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      )
      return res.status(200).json(cached.data)
    }

    // Delegate execution to the SQL Router
    let responseData: BotStatsData
    try {
      responseData = await getBotsData(activeSource, numDays, {
        host: host as string,
      })
    } catch (dbErr) {
      console.error(
        `Database error inside bots API [source: ${activeSource}]:`,
        dbErr
      )
      // Graceful fail-safe fallback
      responseData = {
        totalBots: 0,
        totalHumans: 0,
        totalPageviews: 0,
        botPercentage: 0,
        humanPercentage: 0,
        botsByType: [],
        topBots: [],
      }
    }

    // Evict expired entries
    if (cache.size >= CACHE_MAX) {
      const now = Date.now()
      const expired: string[] = []
      cache.forEach((v, k) => {
        if (now - v.timestamp >= CACHE_TTL) expired.push(k)
      })
      expired.forEach((k) => cache.delete(k))
      if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value
        if (oldest) cache.delete(oldest)
      }
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json(responseData)
  } catch (error) {
    console.error('Bot analytics handler error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
