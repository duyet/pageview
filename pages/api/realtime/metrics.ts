import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getRealtimeMetrics,
  DataSource,
} from '../../../lib/analytics/dataSourceQuery'
import { RealtimeMetrics } from '../../../types/socket'

// Simple in-memory cache mapped by source to prevent crosstalk
const cachedMetrics = new Map<
  string,
  { data: RealtimeMetrics; timestamp: number }
>()
const CACHE_TTL = 30 * 1000 // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealtimeMetrics | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { source = 'postgres' } = req.query
  const activeSource = ['postgres', 'clickhouse', 'duckdb'].includes(
    source as string
  )
    ? (source as DataSource)
    : 'postgres'

  // Check cache first
  const now = Date.now()
  const cached = cachedMetrics.get(activeSource)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    )
    return res.status(200).json(cached.data)
  }

  try {
    let metrics: RealtimeMetrics
    try {
      metrics = await getRealtimeMetrics(activeSource)
    } catch (dbErr) {
      console.error(
        `Database error inside realtime metrics API [source: ${activeSource}]:`,
        dbErr
      )
      // Safe offline fallback state
      metrics = {
        totalViews: 0,
        uniqueVisitors: 0,
        activePages: [],
        recentCountries: [],
        hourlyViews: Array.from({ length: 24 }).map((_, i) => ({
          hour: `${String(i).padStart(2, '0')}:00`,
          views: 0,
        })),
      }
    }

    // Update cache
    cachedMetrics.set(activeSource, { data: metrics, timestamp: Date.now() })

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    )
    res.status(200).json(metrics)
  } catch (error) {
    console.error('Realtime metrics handler error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
