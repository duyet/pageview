import {
  type DataSource,
  getTrendsData,
} from '@/lib/analytics/dataSourceQuery';

// In-memory cache with 5-min TTL and max 50 entries
const cache = new Map<string, { data: ResponseData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 50;

export type TrendData = {
  date: string;
  pageviews: number;
  uniqueVisitors: number;
};

type ResponseData = {
  trends: TrendData[];
  totalPageviews: number;
  totalUniqueVisitors: number;
};

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    const host = searchParams.get('host');
    const urlId = searchParams.get('urlId');
    const excludeBots = searchParams.get('excludeBots');
    const source = searchParams.get('source') || 'postgres';

    const numDays = parseInt(days, 10);

    if (Number.isNaN(numDays) || numDays < 1 || numDays > 365) {
      return Response.json(
        { error: 'Invalid days parameter (1-365)' },
        { status: 400 },
      );
    }

    const activeSource: DataSource = [
      'postgres',
      'clickhouse',
      'duckdb',
    ].includes(source)
      ? (source as DataSource)
      : 'postgres';

    // Separate caches by active source!
    const cacheKey = `trends:${numDays}:${host || ''}:${urlId || ''}:${excludeBots || ''}:${activeSource}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data, { headers: CACHE_HEADERS });
    }

    // Delegate execution to the SQL Router
    let responseData: ResponseData;
    try {
      responseData = await getTrendsData(activeSource, numDays, {
        host: host || undefined,
        urlId: urlId ? parseInt(urlId, 10) : undefined,
        excludeBots: excludeBots === 'true',
      });
    } catch (dbErr) {
      console.error(
        `Database error inside trends API [source: ${activeSource}]:`,
        dbErr,
      );
      // Graceful fail-safe fallback
      responseData = {
        trends: [],
        totalPageviews: 0,
        totalUniqueVisitors: 0,
      };
    }

    // Update in-memory cache
    if (cache.size >= CACHE_MAX) {
      const now = Date.now();
      cache.forEach((v, k) => {
        if (now - v.timestamp >= CACHE_TTL) cache.delete(k);
      });
      if (cache.size >= CACHE_MAX) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return Response.json(responseData, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Analytics trends handler error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
