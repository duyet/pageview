import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  subHours,
  startOfHour,
} from 'date-fns'
import prisma from '../prisma'
import { getBotTypeDescription } from '../botDetection'
import fs from 'fs'
import path from 'path'

export type DataSource = 'postgres' | 'clickhouse' | 'duckdb'

export interface QueryFilters {
  host?: string
  urlId?: number
  excludeBots?: boolean
}

// ---------------------------------------------------------
// Helper: Resolve urlId to a flat filter for ClickHouse/DuckDB
// ---------------------------------------------------------
async function resolveUrlId(
  urlId?: number
): Promise<{ host: string; path: string } | null> {
  if (!urlId) return null
  try {
    const urlRecord = await prisma.url.findUnique({
      where: { id: urlId },
      include: { host: true, slug: true },
    })
    if (urlRecord) {
      return {
        host: urlRecord.host.host,
        path: urlRecord.slug.slug,
      }
    }
  } catch (err) {
    console.error('Error resolving urlId:', err)
  }
  return null
}

// ---------------------------------------------------------
// Helper: ClickHouse REST Client
// ---------------------------------------------------------
async function queryClickHouse<T = any>(sql: string): Promise<T[]> {
  const connectionUrl = process.env.CLICKHOUSE_URL
  if (!connectionUrl) {
    throw new Error('ClickHouse URL is not configured')
  }

  try {
    const parsed = new URL(connectionUrl)

    // Resolve dynamic database.table from the environment URL configuration
    const pathDb = parsed.pathname.replace(/^\//, '')
    const database = parsed.searchParams.get('database') || pathDb || 'default'
    const table = parsed.searchParams.get('table') || 'pageviews'
    const fullTableName = `${database}.${table}`

    // Automatically rewrite "FROM pageviews" in queries to the resolved table identifier!
    const preparedSql = sql.replace(
      /\bFROM\s+pageviews\b/gi,
      `FROM ${fullTableName}`
    )

    const targetUrl = new URL(parsed.origin)
    targetUrl.pathname = '/'
    targetUrl.searchParams.set('query', `${preparedSql} FORMAT JSON`)

    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
    }

    if (parsed.username || parsed.password) {
      const credentials = Buffer.from(
        `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`
      ).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(6000), // 6 second timeout
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errText}`)
    }

    const json = await response.json()
    return (json.data || []) as T[]
  } catch (err) {
    console.error('[ClickHouse Router Error]:', err)
    throw err
  }
}

// ---------------------------------------------------------
// Helper: DuckDB Local JSONL Buffer Client (Fallback Mode)
// ---------------------------------------------------------
async function getDuckDBEvents(): Promise<any[]> {
  try {
    const localBufferPath = path.join(
      process.cwd(),
      '.antigravitycli',
      'duckdb_buffer.jsonl'
    )
    if (!fs.existsSync(localBufferPath)) {
      return []
    }
    const content = await fs.promises.readFile(localBufferPath, 'utf-8')
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          const item = JSON.parse(line)
          item.timestamp = new Date(item.timestamp)
          return item
        } catch (e) {
          return null
        }
      })
      .filter(Boolean) as any[]
  } catch (err) {
    console.error('[DuckDB Buffer Error]:', err)
    return []
  }
}

// Format date helper for ClickHouse query params
function toClickHouseDateTimeStr(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
}

// ============================================================================
// Core Analytics: TRENDS
// ============================================================================
export async function getTrendsData(
  source: DataSource,
  days: number,
  filters?: QueryFilters
) {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, days - 1))
  const { host, urlId, excludeBots } = filters || {}

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
    }

    if (urlId) {
      whereClause.urlId = urlId
    } else if (host) {
      const matchingUrls = await prisma.url.findMany({
        where: { host: { host } },
        select: { id: true },
      })
      const urlIds = matchingUrls.map((u) => u.id)
      if (urlIds.length === 0) {
        return { trends: [], totalPageviews: 0, totalUniqueVisitors: 0 }
      }
      whereClause.urlId = { in: urlIds }
    }

    if (excludeBots) {
      whereClause.ua = { isBot: false }
    }

    const [dailyPageviews, uniqueIpsByDay, allUniqueIps] = await Promise.all([
      prisma.pageView.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.pageView.groupBy({
        by: ['createdAt', 'ip'],
        where: {
          ...whereClause,
          ip: { not: null, notIn: [''] },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.pageView.groupBy({
        by: ['ip'],
        where: {
          ...whereClause,
          ip: { not: null, notIn: [''] },
        },
      }),
    ])

    const pageviewMap = new Map<string, number>()
    const visitorMap = new Map<string, Set<string>>()

    dailyPageviews.forEach((item) => {
      const dateKey = format(startOfDay(item.createdAt), 'yyyy-MM-dd')
      pageviewMap.set(dateKey, (pageviewMap.get(dateKey) || 0) + item._count.id)
    })

    uniqueIpsByDay.forEach((item) => {
      const dateKey = format(startOfDay(item.createdAt), 'yyyy-MM-dd')
      if (!visitorMap.has(dateKey)) visitorMap.set(dateKey, new Set())
      if (item.ip) visitorMap.get(dateKey)!.add(item.ip)
    })

    const trends = []
    let totalPageviews = 0
    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd')
      const pv = pageviewMap.get(dateStr) || 0
      const uv = visitorMap.get(dateStr)?.size || 0

      trends.push({ date: dateStr, pageviews: pv, uniqueVisitors: uv })
      totalPageviews += pv
    }

    return {
      trends,
      totalPageviews,
      totalUniqueVisitors: allUniqueIps.length,
    }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const startDateStr = toClickHouseDateTimeStr(startDate)
    const endDateStr = toClickHouseDateTimeStr(endDate)

    let chFilters = `timestamp >= '${startDateStr}' AND timestamp <= '${endDateStr}'`
    if (host) chFilters += ` AND host = '${host}'`
    if (excludeBots) chFilters += ` AND isBot = 0`

    if (urlId) {
      const resolved = await resolveUrlId(urlId)
      if (resolved) {
        chFilters += ` AND host = '${resolved.host}' AND path = '${resolved.path}'`
      } else {
        return { trends: [], totalPageviews: 0, totalUniqueVisitors: 0 }
      }
    }

    const trendsQuery = `
      SELECT
        formatDateTime(timestamp, '%Y-%m-%d') as dateStr,
        count() as pageviews,
        uniq(ip) as uniqueVisitors
      FROM pageviews
      WHERE ${chFilters}
      GROUP BY dateStr
      ORDER BY dateStr ASC
    `

    const chResults = await queryClickHouse<{
      dateStr: string
      pageviews: number
      uniqueVisitors: number
    }>(trendsQuery)

    const pageviewMap = new Map<string, number>()
    const visitorMap = new Map<string, number>()
    let totalPageviews = 0
    let totalUniqueVisitors = 0

    chResults.forEach((item) => {
      pageviewMap.set(item.dateStr, Number(item.pageviews))
      visitorMap.set(item.dateStr, Number(item.uniqueVisitors))
    })

    // Get total unique visitors across period
    const totalUvQuery = `
      SELECT uniq(ip) as totalUv
      FROM pageviews
      WHERE ${chFilters}
    `
    const uvResult = await queryClickHouse<{ totalUv: number }>(totalUvQuery)
    if (uvResult.length > 0) {
      totalUniqueVisitors = Number(uvResult[0].totalUv)
    }

    const trends = []
    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd')
      const pv = pageviewMap.get(dateStr) || 0
      const uv = visitorMap.get(dateStr) || 0

      trends.push({ date: dateStr, pageviews: pv, uniqueVisitors: uv })
      totalPageviews += pv
    }

    return { trends, totalPageviews, totalUniqueVisitors }
  }

  // 3. DuckDB (Local JSONL fallback) Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()
    const resolvedUrl = urlId ? await resolveUrlId(urlId) : null

    // Filter events in memory
    const filtered = events.filter((ev) => {
      const ts = ev.timestamp
      if (ts < startDate || ts > endDate) return false
      if (excludeBots && ev.isBot) return false
      if (urlId && resolvedUrl) {
        return ev.host === resolvedUrl.host && ev.path === resolvedUrl.path
      } else if (host) {
        return ev.host === host
      }
      return true
    })

    const pageviewMap = new Map<string, number>()
    const visitorMap = new Map<string, Set<string>>()
    const allIps = new Set<string>()

    filtered.forEach((ev) => {
      const dateStr = format(ev.timestamp, 'yyyy-MM-dd')
      pageviewMap.set(dateStr, (pageviewMap.get(dateStr) || 0) + 1)

      if (!visitorMap.has(dateStr)) visitorMap.set(dateStr, new Set())
      if (ev.ip) {
        visitorMap.get(dateStr)!.add(ev.ip)
        allIps.add(ev.ip)
      }
    })

    const trends = []
    let totalPageviews = 0
    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd')
      const pv = pageviewMap.get(dateStr) || 0
      const uv = visitorMap.get(dateStr)?.size || 0

      trends.push({ date: dateStr, pageviews: pv, uniqueVisitors: uv })
      totalPageviews += pv
    }

    return {
      trends,
      totalPageviews,
      totalUniqueVisitors: allIps.size,
    }
  }

  return { trends: [], totalPageviews: 0, totalUniqueVisitors: 0 }
}

// ============================================================================
// Core Analytics: DEVICES
// ============================================================================
export async function getDevicesData(
  source: DataSource,
  days: number,
  filters?: QueryFilters
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const { host, urlId, excludeBots } = filters || {}

  // Helpers to calculate percentages cleanly
  const toDeviceArray = (map: Map<string, number>, total: number) => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
  }

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const whereClause: any = {
      createdAt: { gte: startDate },
    }

    if (urlId) {
      whereClause.urlId = urlId
    } else if (host) {
      const matchingUrls = await prisma.url.findMany({
        where: { host: { host } },
        select: { id: true },
      })
      const urlIds = matchingUrls.map((u) => u.id)
      if (urlIds.length === 0) {
        return { browsers: [], os: [], devices: [], total: 0 }
      }
      whereClause.urlId = { in: urlIds }
    }

    if (excludeBots) {
      whereClause.ua = { isBot: false }
    }

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

    const uaIds = uaStats.map((s) => s.uAId).filter(Boolean) as number[]
    const uaDetails = await prisma.uA.findMany({
      where: { id: { in: uaIds } },
      select: { id: true, browser: true, os: true, deviceType: true },
    })
    const uaMap = new Map(uaDetails.map((ua) => [ua.id, ua]))

    const browserMap = new Map<string, number>()
    const osMap = new Map<string, number>()
    const deviceMap = new Map<string, number>()

    uaStats.forEach((stat) => {
      if (!stat.uAId) return
      const ua = uaMap.get(stat.uAId)
      if (!ua) return

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
    })

    return {
      browsers: toDeviceArray(browserMap, total),
      os: toDeviceArray(osMap, total),
      devices: toDeviceArray(deviceMap, total),
      total,
    }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const startDateStr = toClickHouseDateTimeStr(startDate)
    let chFilters = `timestamp >= '${startDateStr}'`
    if (host) chFilters += ` AND host = '${host}'`
    if (excludeBots) chFilters += ` AND isBot = 0`

    if (urlId) {
      const resolved = await resolveUrlId(urlId)
      if (resolved) {
        chFilters += ` AND host = '${resolved.host}' AND path = '${resolved.path}'`
      } else {
        return { browsers: [], os: [], devices: [], total: 0 }
      }
    }

    // Run parallel aggregates over ClickHouse
    const countQuery = `SELECT count() as total FROM pageviews WHERE ${chFilters}`
    const browserQuery = `
      SELECT browser as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND browser IS NOT NULL AND browser != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const osQuery = `
      SELECT os as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND os IS NOT NULL AND os != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const deviceQuery = `
      SELECT deviceType as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND deviceType IS NOT NULL AND deviceType != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `

    const [totalRes, browsersRaw, osRaw, devicesRaw] = await Promise.all([
      queryClickHouse<{ total: number }>(countQuery),
      queryClickHouse<{ name: string; value: number }>(browserQuery),
      queryClickHouse<{ name: string; value: number }>(osQuery),
      queryClickHouse<{ name: string; value: number }>(deviceQuery),
    ])

    const total = totalRes.length > 0 ? Number(totalRes[0].total) : 0

    const browsers = browsersRaw.map((b) => ({
      name: b.name,
      value: Number(b.value),
      percentage: total > 0 ? Math.round((Number(b.value) / total) * 100) : 0,
    }))

    const os = osRaw.map((o) => ({
      name: o.name,
      value: Number(o.value),
      percentage: total > 0 ? Math.round((Number(o.value) / total) * 100) : 0,
    }))

    const devices = devicesRaw.map((d) => ({
      name: d.name,
      value: Number(d.value),
      percentage: total > 0 ? Math.round((Number(d.value) / total) * 100) : 0,
    }))

    return { browsers, os, devices, total }
  }

  // 3. DuckDB Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()
    const resolvedUrl = urlId ? await resolveUrlId(urlId) : null

    const filtered = events.filter((ev) => {
      if (ev.timestamp < startDate) return false
      if (excludeBots && ev.isBot) return false
      if (urlId && resolvedUrl) {
        return ev.host === resolvedUrl.host && ev.path === resolvedUrl.path
      } else if (host) {
        return ev.host === host
      }
      return true
    })

    const total = filtered.length
    const browserMap = new Map<string, number>()
    const osMap = new Map<string, number>()
    const deviceMap = new Map<string, number>()

    filtered.forEach((ev) => {
      if (ev.browser)
        browserMap.set(ev.browser, (browserMap.get(ev.browser) || 0) + 1)
      if (ev.os) osMap.set(ev.os, (osMap.get(ev.os) || 0) + 1)
      if (ev.deviceType)
        deviceMap.set(ev.deviceType, (deviceMap.get(ev.deviceType) || 0) + 1)
    })

    return {
      browsers: toDeviceArray(browserMap, total),
      os: toDeviceArray(osMap, total),
      devices: toDeviceArray(deviceMap, total),
      total,
    }
  }

  return { browsers: [], os: [], devices: [], total: 0 }
}

// ============================================================================
// Core Analytics: LOCATIONS
// ============================================================================
export async function getLocationsData(
  source: DataSource,
  days: number,
  filters?: QueryFilters
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const { host, urlId, excludeBots } = filters || {}

  const toLocationArray = (map: Map<string, number>, total: number) => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
  }

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const whereClause: any = {
      createdAt: { gte: startDate },
    }

    if (urlId) {
      whereClause.urlId = urlId
    } else if (host) {
      const matchingUrls = await prisma.url.findMany({
        where: { host: { host } },
        select: { id: true },
      })
      const urlIds = matchingUrls.map((u) => u.id)
      if (urlIds.length === 0) {
        return { countries: [], cities: [], total: 0 }
      }
      whereClause.urlId = { in: urlIds }
    }

    if (excludeBots) {
      whereClause.ua = { isBot: false }
    }

    const [countryStats, cityStats, total] = await Promise.all([
      prisma.pageView.groupBy({
        by: ['countryId'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
      prisma.pageView.groupBy({
        by: ['cityId'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
      prisma.pageView.count({ where: whereClause }),
    ])

    const countryIds = countryStats
      .map((s) => s.countryId)
      .filter(Boolean) as number[]
    const countriesDetails = await prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, country: true },
    })
    const countryMap = new Map(countriesDetails.map((c) => [c.id, c.country]))

    const cityIds = cityStats.map((s) => s.cityId).filter(Boolean) as number[]
    const citiesDetails = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, city: true },
    })
    const cityMap = new Map(citiesDetails.map((c) => [c.id, c.city]))

    const countries = countryStats
      .filter((s) => s.countryId && countryMap.has(s.countryId))
      .map((s) => ({
        name: countryMap.get(s.countryId!) || 'Unknown',
        value: s._count.id,
        percentage: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
      }))

    const cities = cityStats
      .filter((s) => s.cityId && cityMap.has(s.cityId))
      .map((s) => ({
        name: cityMap.get(s.cityId!) || 'Unknown',
        value: s._count.id,
        percentage: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
      }))

    return { countries, cities, total }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const startDateStr = toClickHouseDateTimeStr(startDate)
    let chFilters = `timestamp >= '${startDateStr}'`
    if (host) chFilters += ` AND host = '${host}'`
    if (excludeBots) chFilters += ` AND isBot = 0`

    if (urlId) {
      const resolved = await resolveUrlId(urlId)
      if (resolved) {
        chFilters += ` AND host = '${resolved.host}' AND path = '${resolved.path}'`
      } else {
        return { countries: [], cities: [], total: 0 }
      }
    }

    const countQuery = `SELECT count() as total FROM pageviews WHERE ${chFilters}`
    const countryQuery = `
      SELECT country as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND country IS NOT NULL AND country != ''
      GROUP BY name ORDER BY value DESC LIMIT 15
    `
    const cityQuery = `
      SELECT city as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND city IS NOT NULL AND city != ''
      GROUP BY name ORDER BY value DESC LIMIT 15
    `

    const [totalRes, countriesRaw, citiesRaw] = await Promise.all([
      queryClickHouse<{ total: number }>(countQuery),
      queryClickHouse<{ name: string; value: number }>(countryQuery),
      queryClickHouse<{ name: string; value: number }>(cityQuery),
    ])

    const total = totalRes.length > 0 ? Number(totalRes[0].total) : 0

    const countries = countriesRaw.map((c) => ({
      name: c.name,
      value: Number(c.value),
      percentage: total > 0 ? Math.round((Number(c.value) / total) * 100) : 0,
    }))

    const cities = citiesRaw.map((c) => ({
      name: c.name,
      value: Number(c.value),
      percentage: total > 0 ? Math.round((Number(c.value) / total) * 100) : 0,
    }))

    return { countries, cities, total }
  }

  // 3. DuckDB Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()
    const resolvedUrl = urlId ? await resolveUrlId(urlId) : null

    const filtered = events.filter((ev) => {
      if (ev.timestamp < startDate) return false
      if (excludeBots && ev.isBot) return false
      if (urlId && resolvedUrl) {
        return ev.host === resolvedUrl.host && ev.path === resolvedUrl.path
      } else if (host) {
        return ev.host === host
      }
      return true
    })

    const total = filtered.length
    const countryMap = new Map<string, number>()
    const cityMap = new Map<string, number>()

    filtered.forEach((ev) => {
      if (ev.country)
        countryMap.set(ev.country, (countryMap.get(ev.country) || 0) + 1)
      if (ev.city) cityMap.set(ev.city, (cityMap.get(ev.city) || 0) + 1)
    })

    return {
      countries: toLocationArray(countryMap, total),
      cities: toLocationArray(cityMap, total),
      total,
    }
  }

  return { countries: [], cities: [], total: 0 }
}

// ============================================================================
// Core Analytics: BOTS
// ============================================================================
export async function getBotsData(
  source: DataSource,
  days: number,
  filters?: QueryFilters
) {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, days - 1))
  const { host, urlId } = filters || {}

  const processBotTypeAndNames = (
    botsByTypeRaw: any[],
    totalPageviews: number
  ) => {
    const botTypeMap = new Map<string, number>()
    const botNameMap = new Map<string, { botType: string; count: number }>()

    botsByTypeRaw.forEach((ev) => {
      const type = ev.botType || 'crawler'
      botTypeMap.set(type, (botTypeMap.get(type) || 0) + (ev.count || 1))

      if (ev.botName) {
        const key = `${type}:${ev.botName}`
        const current = botNameMap.get(key) || { botType: type, count: 0 }
        botNameMap.set(key, {
          ...current,
          count: current.count + (ev.count || 1),
        })
      }
    })

    const botsByType = Array.from(botTypeMap.entries())
      .map(([botType, count]) => ({
        botType: getBotTypeDescription(botType),
        botName: null,
        count,
        percentage: totalPageviews > 0 ? (count / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const topBots = Array.from(botNameMap.entries())
      .map(([key, data]) => ({
        botType: getBotTypeDescription(data.botType),
        botName: key.split(':')[1],
        count: data.count,
        percentage:
          totalPageviews > 0 ? (data.count / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { botsByType, topBots }
  }

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
    }

    if (host) {
      whereClause.url = { host: { host } }
    }

    const [totalPageviews, botPageviews] = await Promise.all([
      prisma.pageView.count({ where: whereClause }),
      prisma.pageView.count({
        where: {
          ...whereClause,
          ua: { isBot: true },
        },
      }),
    ])
    const humanPageviews = totalPageviews - botPageviews

    const botsByTypeRaw = await prisma.pageView.groupBy({
      by: ['uAId'],
      where: {
        ...whereClause,
        ua: { isBot: true },
      },
      _count: { id: true },
    })

    const uaIds = botsByTypeRaw.map((b) => b.uAId).filter(Boolean) as number[]
    const uaDetails = await prisma.uA.findMany({
      where: { id: { in: uaIds } },
      select: { id: true, botType: true, botName: true },
    })
    const uaMap = new Map(uaDetails.map((ua) => [ua.id, ua]))

    const flatBots = botsByTypeRaw
      .map((item) => {
        if (!item.uAId) return null
        const ua = uaMap.get(item.uAId)
        if (!ua || !ua.botType) return null
        return {
          botType: ua.botType,
          botName: ua.botName,
          count: item._count.id,
        }
      })
      .filter(Boolean)

    const { botsByType, topBots } = processBotTypeAndNames(
      flatBots,
      totalPageviews
    )

    return {
      totalBots: botPageviews,
      totalHumans: humanPageviews,
      totalPageviews,
      botPercentage:
        totalPageviews > 0 ? (botPageviews / totalPageviews) * 100 : 0,
      humanPercentage:
        totalPageviews > 0 ? (humanPageviews / totalPageviews) * 100 : 0,
      botsByType,
      topBots,
    }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const startDateStr = toClickHouseDateTimeStr(startDate)
    const endDateStr = toClickHouseDateTimeStr(endDate)
    let chFilters = `timestamp >= '${startDateStr}' AND timestamp <= '${endDateStr}'`
    if (host) chFilters += ` AND host = '${host}'`

    const countsQuery = `
      SELECT
        count() as total,
        sum(isBot) as bots
      FROM pageviews
      WHERE ${chFilters}
    `
    const typesQuery = `
      SELECT botType, count() as count
      FROM pageviews
      WHERE ${chFilters} AND isBot = 1 AND botType IS NOT NULL AND botType != ''
      GROUP BY botType
    `
    const namesQuery = `
      SELECT botType, botName, count() as count
      FROM pageviews
      WHERE ${chFilters} AND isBot = 1 AND botName IS NOT NULL AND botName != ''
      GROUP BY botType, botName
      ORDER BY count DESC
      LIMIT 10
    `

    const [countsRaw, typesRaw, namesRaw] = await Promise.all([
      queryClickHouse<{ total: number; bots: number }>(countsQuery),
      queryClickHouse<{ botType: string; count: number }>(typesQuery),
      queryClickHouse<{ botType: string; botName: string; count: number }>(
        namesQuery
      ),
    ])

    const totalPageviews = countsRaw.length > 0 ? Number(countsRaw[0].total) : 0
    const botPageviews = countsRaw.length > 0 ? Number(countsRaw[0].bots) : 0
    const humanPageviews = totalPageviews - botPageviews

    const botsByType = typesRaw
      .map((t) => ({
        botType: getBotTypeDescription(t.botType),
        botName: null,
        count: Number(t.count),
        percentage:
          totalPageviews > 0 ? (Number(t.count) / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const topBots = namesRaw
      .map((n) => ({
        botType: getBotTypeDescription(n.botType),
        botName: n.botName,
        count: Number(n.count),
        percentage:
          totalPageviews > 0 ? (Number(n.count) / totalPageviews) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      totalBots: botPageviews,
      totalHumans: humanPageviews,
      totalPageviews,
      botPercentage:
        totalPageviews > 0 ? (botPageviews / totalPageviews) * 100 : 0,
      humanPercentage:
        totalPageviews > 0 ? (humanPageviews / totalPageviews) * 100 : 0,
      botsByType,
      topBots,
    }
  }

  // 3. DuckDB Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()

    const filtered = events.filter((ev) => {
      const ts = ev.timestamp
      if (ts < startDate || ts > endDate) return false
      if (host && ev.host !== host) return false
      return true
    })

    const totalPageviews = filtered.length
    const botPageviews = filtered.filter((ev) => ev.isBot).length
    const humanPageviews = totalPageviews - botPageviews

    const flatBots = filtered
      .filter((ev) => ev.isBot)
      .map((ev) => ({
        botType: ev.botType || 'crawler',
        botName: ev.botName,
        count: 1,
      }))

    const { botsByType, topBots } = processBotTypeAndNames(
      flatBots,
      totalPageviews
    )

    return {
      totalBots: botPageviews,
      totalHumans: humanPageviews,
      totalPageviews,
      botPercentage:
        totalPageviews > 0 ? (botPageviews / totalPageviews) * 100 : 0,
      humanPercentage:
        totalPageviews > 0 ? (humanPageviews / totalPageviews) * 100 : 0,
      botsByType,
      topBots,
    }
  }

  return {
    totalBots: 0,
    totalHumans: 0,
    totalPageviews: 0,
    botPercentage: 0,
    humanPercentage: 0,
    botsByType: [],
    topBots: [],
  }
}

// ============================================================================
// Core Analytics: REALTIME METRICS
// ============================================================================
export async function getRealtimeMetrics(source: DataSource) {
  const currentTime = new Date()
  const last24Hours = subHours(currentTime, 24)
  const last1Hour = subHours(currentTime, 1)

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const [totalViews, uniqueIpsResult] = await Promise.all([
      prisma.pageView.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      prisma.pageView.groupBy({
        by: ['ip'],
        where: {
          createdAt: { gte: last24Hours },
          ip: { not: null, notIn: [''] },
        },
        _count: { _all: true },
      }),
    ])

    const uniqueVisitors = uniqueIpsResult.length

    // Active pages
    const activePages = await prisma.pageView.groupBy({
      by: ['urlId'],
      where: { createdAt: { gte: last1Hour } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const urlIds = activePages
      .map((page) => page.urlId)
      .filter(Boolean) as number[]
    const urls = await prisma.url.findMany({
      where: { id: { in: urlIds } },
      select: { id: true, url: true },
    })
    const urlMap = new Map(urls.map((u) => [u.id, u.url]))

    const activePagesData = activePages
      .filter((page) => page.urlId && urlMap.has(page.urlId))
      .map((page) => ({
        path: urlMap.get(page.urlId!) || 'Unknown',
        views: page._count.id,
      }))

    // Recent countries
    const recentCountries = await prisma.pageView.groupBy({
      by: ['countryId'],
      where: {
        createdAt: { gte: last1Hour },
        countryId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const countryIds = recentCountries
      .map((c) => c.countryId)
      .filter(Boolean) as number[]
    const countries = await prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, country: true },
    })
    const countryMap = new Map(countries.map((c) => [c.id, c.country]))

    const recentCountriesData = recentCountries
      .filter((c) => c.countryId && countryMap.has(c.countryId))
      .map((c) => ({
        country: countryMap.get(c.countryId!) || 'Unknown',
        count: c._count.id,
      }))

    // Hourly views
    const hourlyViews = await prisma.pageView.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: last24Hours } },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    const hourlyMap = new Map<string, number>()
    hourlyViews.forEach((item) => {
      const hourKey = format(startOfHour(item.createdAt), 'yyyy-MM-dd HH:00')
      hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + item._count.id)
    })

    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(currentTime, i))
      const hourKey = format(hour, 'yyyy-MM-dd HH:00')
      const hourLabel = format(hour, 'HH:00')

      hourlyData.push({
        hour: hourLabel,
        views: hourlyMap.get(hourKey) || 0,
      })
    }

    return {
      totalViews,
      uniqueVisitors,
      activePages: activePagesData,
      recentCountries: recentCountriesData,
      hourlyViews: hourlyData,
    }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const last24HoursStr = toClickHouseDateTimeStr(last24Hours)
    const last1HourStr = toClickHouseDateTimeStr(last1Hour)

    const viewsAndUvQuery = `
      SELECT
        count() as totalViews,
        uniq(ip) as uniqueVisitors
      FROM pageviews
      WHERE timestamp >= '${last24HoursStr}'
    `
    const activePagesQuery = `
      SELECT path as path, count() as views
      FROM pageviews
      WHERE timestamp >= '${last1HourStr}' AND path IS NOT NULL AND path != ''
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `
    const recentCountriesQuery = `
      SELECT country, count() as count
      FROM pageviews
      WHERE timestamp >= '${last1HourStr}' AND country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY count DESC
      LIMIT 5
    `
    const hourlyQuery = `
      SELECT
        formatDateTime(timestamp, '%Y-%m-%d %H:00') as hourKey,
        count() as views
      FROM pageviews
      WHERE timestamp >= '${last24HoursStr}'
      GROUP BY hourKey
      ORDER BY hourKey ASC
    `

    const [statsRes, activeRaw, countriesRaw, hourlyRaw] = await Promise.all([
      queryClickHouse<{ totalViews: number; uniqueVisitors: number }>(
        viewsAndUvQuery
      ),
      queryClickHouse<{ path: string; views: number }>(activePagesQuery),
      queryClickHouse<{ country: string; count: number }>(recentCountriesQuery),
      queryClickHouse<{ hourKey: string; views: number }>(hourlyQuery),
    ])

    const totalViews = statsRes.length > 0 ? Number(statsRes[0].totalViews) : 0
    const uniqueVisitors =
      statsRes.length > 0 ? Number(statsRes[0].uniqueVisitors) : 0

    const activePages = activeRaw.map((a) => ({
      path: a.path,
      views: Number(a.views),
    }))

    const recentCountries = countriesRaw.map((c) => ({
      country: c.country,
      count: Number(c.count),
    }))

    const hourlyMap = new Map<string, number>()
    hourlyRaw.forEach((item) => {
      hourlyMap.set(item.hourKey, Number(item.views))
    })

    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(currentTime, i))
      const hourKey = format(hour, 'yyyy-MM-dd HH:00')
      const hourLabel = format(hour, 'HH:00')

      hourlyData.push({
        hour: hourLabel,
        views: hourlyMap.get(hourKey) || 0,
      })
    }

    return {
      totalViews,
      uniqueVisitors,
      activePages,
      recentCountries,
      hourlyViews: hourlyData,
    }
  }

  // 3. DuckDB Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()

    const filtered24 = events.filter((ev) => ev.timestamp >= last24Hours)
    const filtered1 = events.filter((ev) => ev.timestamp >= last1Hour)

    const totalViews = filtered24.length

    const ips = new Set<string>()
    filtered24.forEach((ev) => {
      if (ev.ip) ips.add(ev.ip)
    })
    const uniqueVisitors = ips.size

    // Active pages
    const pathMap = new Map<string, number>()
    filtered1.forEach((ev) => {
      if (ev.path) pathMap.set(ev.path, (pathMap.get(ev.path) || 0) + 1)
    })
    const activePages = Array.from(pathMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }))

    // Recent countries
    const countryMap = new Map<string, number>()
    filtered1.forEach((ev) => {
      if (ev.country)
        countryMap.set(ev.country, (countryMap.get(ev.country) || 0) + 1)
    })
    const recentCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }))

    // Hourly views
    const hourlyMap = new Map<string, number>()
    filtered24.forEach((ev) => {
      const hourKey = format(startOfHour(ev.timestamp), 'yyyy-MM-dd HH:00')
      hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + 1)
    })

    const hourlyData = []
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(currentTime, i))
      const hourKey = format(hour, 'yyyy-MM-dd HH:00')
      const hourLabel = format(hour, 'HH:00')

      hourlyData.push({
        hour: hourLabel,
        views: hourlyMap.get(hourKey) || 0,
      })
    }

    return {
      totalViews,
      uniqueVisitors,
      activePages,
      recentCountries,
      hourlyViews: hourlyData,
    }
  }

  return {
    totalViews: 0,
    uniqueVisitors: 0,
    activePages: [],
    recentCountries: [],
    hourlyViews: [],
  }
}

// ============================================================================
// Core Analytics: AUDIENCE & MARKETING
// ============================================================================
export async function getAudienceData(
  source: DataSource,
  days: number,
  filters?: QueryFilters
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const { host, urlId, excludeBots } = filters || {}

  const toAudienceArray = (
    map: Map<string, number>,
    total: number,
    limit = 10
  ) => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({
        name: name || 'Unknown',
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
  }

  // 1. PostgreSQL (Prisma) Engine
  if (source === 'postgres') {
    const whereClause: any = {
      createdAt: { gte: startDate },
    }

    if (urlId) {
      whereClause.urlId = urlId
    } else if (host) {
      const matchingUrls = await prisma.url.findMany({
        where: { host: { host } },
        select: { id: true },
      })
      const urlIds = matchingUrls.map((u) => u.id)
      if (urlIds.length === 0) {
        return {
          utmSources: [],
          utmCampaigns: [],
          utmMediums: [],
          languages: [],
          viewports: [],
          total: 0,
        }
      }
      whereClause.urlId = { in: urlIds }
    }

    if (excludeBots) {
      whereClause.ua = { isBot: false }
    }

    const [rawPageviews, total] = await Promise.all([
      prisma.pageView.findMany({
        where: whereClause,
        select: {
          language: true,
          screenWidth: true,
          screenHeight: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
      }),
      prisma.pageView.count({ where: whereClause }),
    ])

    const utmSourceMap = new Map<string, number>()
    const utmCampaignMap = new Map<string, number>()
    const utmMediumMap = new Map<string, number>()
    const languageMap = new Map<string, number>()
    const viewportMap = new Map<string, number>()

    rawPageviews.forEach((pv) => {
      if (pv.utmSource)
        utmSourceMap.set(
          pv.utmSource,
          (utmSourceMap.get(pv.utmSource) || 0) + 1
        )
      if (pv.utmCampaign)
        utmCampaignMap.set(
          pv.utmCampaign,
          (utmCampaignMap.get(pv.utmCampaign) || 0) + 1
        )
      if (pv.utmMedium)
        utmMediumMap.set(
          pv.utmMedium,
          (utmMediumMap.get(pv.utmMedium) || 0) + 1
        )
      if (pv.language) {
        const langClean = pv.language.split(',')[0].split('-')[0].toLowerCase()
        languageMap.set(langClean, (languageMap.get(langClean) || 0) + 1)
      }
      if (pv.screenWidth && pv.screenHeight) {
        const res = `${pv.screenWidth}x${pv.screenHeight}`
        viewportMap.set(res, (viewportMap.get(res) || 0) + 1)
      }
    })

    return {
      utmSources: toAudienceArray(utmSourceMap, total),
      utmCampaigns: toAudienceArray(utmCampaignMap, total),
      utmMediums: toAudienceArray(utmMediumMap, total),
      languages: toAudienceArray(languageMap, total),
      viewports: toAudienceArray(viewportMap, total),
      total,
    }
  }

  // 2. ClickHouse Engine
  if (source === 'clickhouse') {
    const startDateStr = toClickHouseDateTimeStr(startDate)
    let chFilters = `timestamp >= '${startDateStr}'`
    if (host) chFilters += ` AND host = '${host}'`
    if (excludeBots) chFilters += ` AND isBot = 0`

    if (urlId) {
      const resolved = await resolveUrlId(urlId)
      if (resolved) {
        chFilters += ` AND host = '${resolved.host}' AND path = '${resolved.path}'`
      } else {
        return {
          utmSources: [],
          utmCampaigns: [],
          utmMediums: [],
          languages: [],
          viewports: [],
          total: 0,
        }
      }
    }

    const countQuery = `SELECT count() as total FROM pageviews WHERE ${chFilters}`
    const utmSourcesQuery = `
      SELECT utmSource as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND utmSource IS NOT NULL AND utmSource != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const utmCampaignsQuery = `
      SELECT utmCampaign as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND utmCampaign IS NOT NULL AND utmCampaign != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const utmMediumsQuery = `
      SELECT utmMedium as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND utmMedium IS NOT NULL AND utmMedium != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const languagesQuery = `
      SELECT lower(splitByChar('-', splitByChar(',', language)[1])[1]) as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND language IS NOT NULL AND language != ''
      GROUP BY name ORDER BY value DESC LIMIT 10
    `
    const viewportsQuery = `
      SELECT concat(toString(screenWidth), 'x', toString(screenHeight)) as name, count() as value
      FROM pageviews
      WHERE ${chFilters} AND screenWidth IS NOT NULL AND screenWidth > 0 AND screenHeight IS NOT NULL AND screenHeight > 0
      GROUP BY name ORDER BY value DESC LIMIT 10
    `

    const [
      totalRes,
      sourcesRaw,
      campaignsRaw,
      mediumsRaw,
      langsRaw,
      viewportsRaw,
    ] = await Promise.all([
      queryClickHouse<{ total: number }>(countQuery),
      queryClickHouse<{ name: string; value: number }>(utmSourcesQuery),
      queryClickHouse<{ name: string; value: number }>(utmCampaignsQuery),
      queryClickHouse<{ name: string; value: number }>(utmMediumsQuery),
      queryClickHouse<{ name: string; value: number }>(languagesQuery),
      queryClickHouse<{ name: string; value: number }>(viewportsQuery),
    ])

    const total = totalRes.length > 0 ? Number(totalRes[0].total) : 0

    const mapRaw = (arr: any[]) =>
      arr.map((item) => ({
        name: item.name || 'Unknown',
        value: Number(item.value),
        percentage:
          total > 0 ? Math.round((Number(item.value) / total) * 100) : 0,
      }))

    return {
      utmSources: mapRaw(sourcesRaw),
      utmCampaigns: mapRaw(campaignsRaw),
      utmMediums: mapRaw(mediumsRaw),
      languages: mapRaw(langsRaw),
      viewports: mapRaw(viewportsRaw),
      total,
    }
  }

  // 3. DuckDB Engine
  if (source === 'duckdb') {
    const events = await getDuckDBEvents()
    const resolvedUrl = urlId ? await resolveUrlId(urlId) : null

    const filtered = events.filter((ev) => {
      if (ev.timestamp < startDate) return false
      if (excludeBots && ev.isBot) return false
      if (urlId && resolvedUrl) {
        return ev.host === resolvedUrl.host && ev.path === resolvedUrl.path
      } else if (host) {
        return ev.host === host
      }
      return true
    })

    const total = filtered.length
    const utmSourceMap = new Map<string, number>()
    const utmCampaignMap = new Map<string, number>()
    const utmMediumMap = new Map<string, number>()
    const languageMap = new Map<string, number>()
    const viewportMap = new Map<string, number>()

    filtered.forEach((ev) => {
      if (ev.utmSource)
        utmSourceMap.set(
          ev.utmSource,
          (utmSourceMap.get(ev.utmSource) || 0) + 1
        )
      if (ev.utmCampaign)
        utmCampaignMap.set(
          ev.utmCampaign,
          (utmCampaignMap.get(ev.utmCampaign) || 0) + 1
        )
      if (ev.utmMedium)
        utmMediumMap.set(
          ev.utmMedium,
          (utmMediumMap.get(ev.utmMedium) || 0) + 1
        )
      if (ev.language) {
        const langClean = ev.language.split(',')[0].split('-')[0].toLowerCase()
        languageMap.set(langClean, (languageMap.get(langClean) || 0) + 1)
      }
      if (ev.screenWidth && ev.screenHeight) {
        const res = `${ev.screenWidth}x${ev.screenHeight}`
        viewportMap.set(res, (viewportMap.get(res) || 0) + 1)
      }
    })

    return {
      utmSources: toAudienceArray(utmSourceMap, total),
      utmCampaigns: toAudienceArray(utmCampaignMap, total),
      utmMediums: toAudienceArray(utmMediumMap, total),
      languages: toAudienceArray(languageMap, total),
      viewports: toAudienceArray(viewportMap, total),
      total,
    }
  }

  return {
    utmSources: [],
    utmCampaigns: [],
    utmMediums: [],
    languages: [],
    viewports: [],
    total: 0,
  }
}
