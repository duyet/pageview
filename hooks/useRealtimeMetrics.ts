import { useState, useEffect } from 'react'
import { RealtimeMetrics } from '../types/socket'
import { useSocket } from './useSocket'

export const useRealtimeMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { socket, isConnected } = useSocket()

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/realtime/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      const data: RealtimeMetrics = await response.json()
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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

  // Listen for real-time updates when socket is connected
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('metrics-update', (newMetrics: RealtimeMetrics) => {
        setMetrics(newMetrics)
      })

      return () => {
        socket.off('metrics-update')
      }
    }
  }, [socket, isConnected])

  return { metrics, loading, error, refetch: fetchMetrics }
}
