import { ClickHouseAdapter } from '../lib/adapters/clickhouse'
import { PageViewEvent } from '../lib/adapters/types'
import dotenv from 'dotenv'
import path from 'path'

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

console.log('Testing ClickHouse Connection...')
console.log('CLICKHOUSE_URL:', process.env.CLICKHOUSE_URL)

const testEvent: PageViewEvent = {
  id: 'test-ch-' + Math.random().toString(36).substring(2, 9),
  sessionId: 'sess-ch-test',
  url: 'https://mysite.com/test-clickhouse',
  host: 'mysite.com',
  path: '/test-clickhouse',
  title: 'Test ClickHouse Event',
  referrer: 'https://google.com/',
  timestamp: new Date(),
  ua: 'Mozilla/5.0 Chrome/124.0.0',
  browser: 'Chrome',
  browserVersion: '124.0.0',
  os: 'macOS',
  osVersion: '14.4.1',
  isBot: false,
  ip: '127.0.0.1',
  country: 'United States',
  city: 'Seattle',
  region: 'WA',
  screenWidth: 1920,
  screenHeight: 1080,
  language: 'en-US',
  utmSource: 'clickhouse-test',
}

async function run() {
  const adapter = new ClickHouseAdapter()

  console.log('Adapter enabled:', adapter.enabled)

  // Cast to access internal properties
  const priv = adapter as any
  console.log('Parsed database:', priv.database)
  console.log('Parsed table:', priv.table)
  console.log('Target endpoint:', priv.endpoint)

  try {
    console.log('Initializing ClickHouse adapter...')
    await adapter.initialize()

    console.log('Broadcasting test pageview...')
    await adapter.broadcast(testEvent)
    console.log('SUCCESS! Pageview broadcast completed.')
  } catch (err: any) {
    console.error('FAILED ClickHouse Broadcast:', err.message)
    if (err.stack) console.error(err.stack)
  }
}

run()
