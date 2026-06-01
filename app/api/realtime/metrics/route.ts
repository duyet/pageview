import {
  type DataSource,
  getRealtimeMetrics,
} from '@/lib/analytics/dataSourceQuery';
import type { RealtimeMetrics } from '@/types/socket';

// Simple in-memory cache mapped by source to prevent crosstalk
const cachedMetrics = new Map<
  string,
  { data: RealtimeMetrics; timestamp: number }
>();
const CACHE_TTL = 30 * 1000; // 30 seconds

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'postgres';
  const activeSource: DataSource = [
    'postgres',
    'clickhouse',
    'duckdb',
  ].includes(source)
    ? (source as DataSource)
    : 'postgres';

  // Check cache first
  const now = Date.now();
  const cached = cachedMetrics.get(activeSource);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return Response.json(cached.data, { headers: CACHE_HEADERS });
  }

  try {
    let metrics: RealtimeMetrics;
    try {
      metrics = await getRealtimeMetrics(activeSource);
    } catch (dbErr) {
      console.error(
        `Database error inside realtime metrics API [source: ${activeSource}]:`,
        dbErr,
      );
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
      };
    }

    // Update cache
    cachedMetrics.set(activeSource, { data: metrics, timestamp: Date.now() });

    return Response.json(metrics, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Realtime metrics handler error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
