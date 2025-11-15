import { useQuery } from '@tanstack/react-query'
import { TrendData } from '@/pages/api/analytics/trends'
import { DeviceData } from '@/pages/api/analytics/devices'
import { LocationData } from '@/pages/api/analytics/locations'

// Hook for fetching trends data
export function useTrendsData(days: number, host?: string) {
  return useQuery({
    queryKey: ['trends', days, host],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() })
      if (host) params.append('host', host)

      const response = await fetch(`/api/analytics/trends?${params}`)
      if (!response.ok) throw new Error('Failed to fetch trends')

      const data = await response.json()
      return {
        trends: data.trends as TrendData[],
        totalPageviews: data.totalPageviews as number,
        totalUniqueVisitors: data.totalUniqueVisitors as number,
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })
}

// Hook for fetching devices data
export function useDevicesData(days: number, host?: string) {
  return useQuery({
    queryKey: ['devices', days, host],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() })
      if (host) params.append('host', host)

      const response = await fetch(`/api/analytics/devices?${params}`)
      if (!response.ok) throw new Error('Failed to fetch devices')

      const data = await response.json()
      return {
        browsers: data.browsers as DeviceData[],
        os: data.os as DeviceData[],
        devices: data.devices as DeviceData[],
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}

// Hook for fetching locations data
export function useLocationsData(days: number, host?: string) {
  return useQuery({
    queryKey: ['locations', days, host],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() })
      if (host) params.append('host', host)

      const response = await fetch(`/api/analytics/locations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch locations')

      const data = await response.json()
      return {
        countries: data.countries as LocationData[],
        cities: data.cities as LocationData[],
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}
