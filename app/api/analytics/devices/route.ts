import {
  type DataSource,
  getDevicesData,
} from '@/lib/analytics/dataSourceQuery';

export type DeviceData = {
  name: string;
  value: number;
  percentage: number;
};

type ResponseData = {
  browsers: DeviceData[];
  os: DeviceData[];
  devices: DeviceData[];
  total: number;
};

// In-memory cache with 5-minute TTL (max 100 entries)
const cache = new Map<string, { data: ResponseData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 100;

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

    const cacheKey = `devices:${numDays}:${host || ''}:${urlId || ''}:${excludeBots || ''}:${activeSource}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data, { headers: CACHE_HEADERS });
    }

    let responseData: ResponseData;
    try {
      responseData = await getDevicesData(activeSource, numDays, {
        host: host || undefined,
        urlId: urlId ? parseInt(urlId, 10) : undefined,
        excludeBots: excludeBots === 'true',
      });
    } catch (dbErr) {
      console.error(
        `Database error inside devices API [source: ${activeSource}]:`,
        dbErr,
      );
      responseData = { browsers: [], os: [], devices: [], total: 0 };
    }

    // Evict expired entries
    if (cache.size >= CACHE_MAX_SIZE) {
      const now = Date.now();
      cache.forEach((entry, key) => {
        if (now - entry.timestamp >= CACHE_TTL) cache.delete(key);
      });
      if (cache.size >= CACHE_MAX_SIZE) {
        const keys = Array.from(cache.keys());
        for (let i = 0; i < keys.length / 2; i++) cache.delete(keys[i]);
      }
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return Response.json(responseData, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Analytics devices API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
