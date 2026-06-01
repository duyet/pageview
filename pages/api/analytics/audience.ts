import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getAudienceData,
  DataSource,
} from '../../../lib/analytics/dataSourceQuery'

export type AudienceDetail = {
  name: string
  value: number
  percentage: number
}

type ResponseData = {
  utmSources: AudienceDetail[]
  utmCampaigns: AudienceDetail[]
  utmMediums: AudienceDetail[]
  languages: AudienceDetail[]
  viewports: AudienceDetail[]
  total: number
}

const cache = new Map<string, { data: ResponseData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX = 50

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      days = '30',
      host,
      urlId,
      excludeBots,
      source = 'postgres',
    } = req.query
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
    const cacheKey = `audience:${numDays}:${host || ''}:${urlId || ''}:${excludeBots || ''}:${activeSource}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      )
      return res.status(200).json(cached.data)
    }

    // Delegate execution to the SQL Router
    let responseData: ResponseData
    try {
      responseData = await getAudienceData(activeSource, numDays, {
        host: host as string,
        urlId: urlId ? parseInt(urlId as string, 10) : undefined,
        excludeBots: excludeBots === 'true',
      })
    } catch (dbErr) {
      console.error(
        `Database error inside audience API [source: ${activeSource}]:`,
        dbErr
      )
      // Graceful fail-safe fallback
      responseData = {
        utmSources: [],
        utmCampaigns: [],
        utmMediums: [],
        languages: [],
        viewports: [],
        total: 0,
      }
    }

    // Evict expired entries
    if (cache.size >= CACHE_MAX) {
      const now = Date.now()
      cache.forEach((v, k) => {
        if (now - v.timestamp >= CACHE_TTL) cache.delete(k)
      })
      if (cache.size >= CACHE_MAX) {
        const firstKey = cache.keys().next().value
        if (firstKey !== undefined) cache.delete(firstKey)
      }
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json(responseData)
  } catch (error) {
    console.error('Analytics audience API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
