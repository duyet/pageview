import { useState, useEffect } from 'react'
import { RealtimeMetrics } from '../types/socket'

export const useRealtimeMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/realtime/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      const data: RealtimeMetrics = await response.json()
      setMetrics(data)
      setError(null)
      setIsConnected(true) // Mark as connected on successful fetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsConnected(false) // Mark as disconnected on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchMetrics()

    // Set up periodic refresh
    const interval = setInterval(fetchMetrics, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return { metrics, loading, error, isConnected, refetch: fetchMetrics }
}
