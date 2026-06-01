import path from 'node:path';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const connectionUrl = process.env.CLICKHOUSE_URL;
  if (!connectionUrl) {
    console.error('CLICKHOUSE_URL not configured');
    return;
  }

  const parsed = new URL(connectionUrl);
  console.log('ClickHouse host:', parsed.hostname);
  console.log('ClickHouse origin:', parsed.origin);

  const targetUrl = new URL(parsed.origin);
  targetUrl.pathname = '/';

  const query = `SELECT id, url, timestamp, country, city FROM pageview.pageviews ORDER BY timestamp DESC LIMIT 5 FORMAT JSONEachRow`;
  targetUrl.searchParams.set('query', query);

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain',
  };

  if (parsed.username || parsed.password) {
    const credentials = Buffer.from(
      `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`,
    ).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
  }

  console.log('Querying:', targetUrl.toString().replace(/:[^:@]+@/, ':***@'));

  try {
    const res = await fetch(targetUrl.toString(), { method: 'POST', headers });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `ClickHouse query failed: HTTP ${res.status}:`,
        errText.substring(0, 500),
      );
      return;
    }

    const text = await res.text();
    console.log('--- RECENT CLICKHOUSE RECORDS ---');
    text
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        try {
          const r = JSON.parse(line);
          console.log(`  ${r.timestamp} | ${r.url} | ${r.country} | ${r.city}`);
        } catch {
          console.log(' ', line);
        }
      });
  } catch (err: any) {
    console.error('Error querying ClickHouse:', err.message);
  }
}

run();
