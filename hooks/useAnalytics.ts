import { useQuery } from '@tanstack/react-query'
import { TrendData } from '@/app/api/analytics/trends/route'
import { DeviceData } from '@/app/api/analytics/devices/route'
import { LocationData } from '@/app/api/analytics/locations/route'
import { BotStatsData } from '@/components/charts/BotChart'
import { useDataSource } from '../components/DataSourceContext'

export interface AnalyticsFilters {
  host?: string
  urlId?: number
  excludeBots?: boolean
}

// Hook for fetching trends data
export function useTrendsData(days: number, filters?: AnalyticsFilters) {
  const { host, urlId, excludeBots } = filters || {}
  const { dataSource } = useDataSource()

  return useQuery({
    queryKey: ['trends', days, host, urlId, excludeBots, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        source: dataSource,
      })
      if (host) params.append('host', host)
      if (urlId) params.append('urlId', urlId.toString())
      if (excludeBots) params.append('excludeBots', 'true')

      const response = await fetch(`/api/analytics/trends?${params}`)
      if (!response.ok) throw new Error('Failed to fetch trends')

      const data = await response.json()
      return {
        trends: data.trends as TrendData[],
        totalPageviews: data.totalPageviews as number,
        totalUniqueVisitors: data.totalUniqueVisitors as number,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  })
}

// Hook for fetching devices data
export function useDevicesData(days: number, filters?: AnalyticsFilters) {
  const { host, urlId, excludeBots } = filters || {}
  const { dataSource } = useDataSource()

  return useQuery({
    queryKey: ['devices', days, host, urlId, excludeBots, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        source: dataSource,
      })
      if (host) params.append('host', host)
      if (urlId) params.append('urlId', urlId.toString())
      if (excludeBots) params.append('excludeBots', 'true')

      const response = await fetch(`/api/analytics/devices?${params}`)
      if (!response.ok) throw new Error('Failed to fetch devices')

      const data = await response.json()
      return {
        browsers: data.browsers as DeviceData[],
        os: data.os as DeviceData[],
        devices: data.devices as DeviceData[],
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  })
}

// Hook for fetching locations data
export function useLocationsData(days: number, filters?: AnalyticsFilters) {
  const { host, urlId, excludeBots } = filters || {}
  const { dataSource } = useDataSource()

  return useQuery({
    queryKey: ['locations', days, host, urlId, excludeBots, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        source: dataSource,
      })
      if (host) params.append('host', host)
      if (urlId) params.append('urlId', urlId.toString())
      if (excludeBots) params.append('excludeBots', 'true')

      const response = await fetch(`/api/analytics/locations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch locations')

      const data = await response.json()
      return {
        countries: data.countries as LocationData[],
        cities: data.cities as LocationData[],
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  })
}

// Hook for fetching bot analytics data
export function useBotsData(days: number, filters?: AnalyticsFilters) {
  const { host, urlId } = filters || {}
  const { dataSource } = useDataSource()

  return useQuery({
    queryKey: ['bots', days, host, urlId, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        source: dataSource,
      })
      if (host) params.append('host', host)
      if (urlId) params.append('urlId', urlId.toString())

      const response = await fetch(`/api/analytics/bots?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bot analytics')

      return (await response.json()) as BotStatsData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  })
}

export interface AudienceData {
  utmSources: { name: string; value: number; percentage: number }[]
  utmCampaigns: { name: string; value: number; percentage: number }[]
  utmMediums: { name: string; value: number; percentage: number }[]
  languages: { name: string; value: number; percentage: number }[]
  viewports: { name: string; value: number; percentage: number }[]
  total: number
}

// Hook for fetching audience & marketing data
export function useAudienceData(days: number, filters?: AnalyticsFilters) {
  const { host, urlId, excludeBots } = filters || {}
  const { dataSource } = useDataSource()

  return useQuery({
    queryKey: ['audience', days, host, urlId, excludeBots, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        source: dataSource,
      })
      if (host) params.append('host', host)
      if (urlId) params.append('urlId', urlId.toString())
      if (excludeBots) params.append('excludeBots', 'true')

      const response = await fetch(`/api/analytics/audience?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audience analytics')

      return (await response.json()) as AudienceData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  })
}
