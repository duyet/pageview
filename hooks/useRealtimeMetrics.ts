import { useCallback, useEffect, useState } from 'react';
import { useDataSource } from '../components/DataSourceContext';
import type { RealtimeMetrics } from '../types/socket';

export const useRealtimeMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { dataSource } = useDataSource();

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/realtime/metrics?source=${dataSource}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data: RealtimeMetrics = await response.json();
      setMetrics(data);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [dataSource]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchMetrics]);

  return { metrics, loading, error, isConnected, refetch: fetchMetrics };
};
