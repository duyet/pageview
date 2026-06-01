import { loadEnvConfig } from '@next/env'

// Load environment variables automatically using Next.js native loader
loadEnvConfig(process.cwd())

// Resolve targeted ClickHouse URL: Command parameter > CLICKHOUSE_ADMIN_URL > CLICKHOUSE_URL
const targetUrlString =
  process.argv[2] ||
  process.env.CLICKHOUSE_ADMIN_URL ||
  process.env.CLICKHOUSE_URL

if (!targetUrlString) {
  console.error('\n❌ ERROR: No ClickHouse connection URL found.')
  console.error(
    'Please set CLICKHOUSE_URL or CLICKHOUSE_ADMIN_URL in .env.local, or pass the URL as an argument:'
  )
  console.error(
    '  npx tsx scripts/init-clickhouse.ts "https://admin:password@host:8123/database"\n'
  )
  process.exit(1)
}

async function run() {
  console.log('\n🚀 Starting ClickHouse Database/Table auto-initialization...')

  let parsed: URL
  try {
    parsed = new URL(targetUrlString)
  } catch (err) {
    console.error('❌ ERROR: Invalid ClickHouse URL format:', targetUrlString)
    process.exit(1)
  }

  const pathDb = parsed.pathname.replace(/^\//, '')
  const database = parsed.searchParams.get('database') || pathDb || 'default'
  const table = parsed.searchParams.get('table') || 'pageviews'

  // Construct target HTTP base endpoint URL
  const targetUrl = new URL(parsed.origin)
  targetUrl.pathname = '/'

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain',
  }

  // Base64 encode credentials if present
  if (parsed.username || parsed.password) {
    const credentials = Buffer.from(
      `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`
    ).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
  }

  console.log(`📡 Connecting to server: ${parsed.origin}`)
  console.log(`📁 Database: "${database}"`)
  console.log(`📊 Table: "${table}"`)

  try {
    // 1. Create Database if not default
    if (database !== 'default') {
      console.log(`\n1. Creating database "${database}" if not exists...`)
      const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${database}`

      const dbRes = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: createDbQuery,
      })

      if (!dbRes.ok) {
        const dbErr = await dbRes.text()
        throw new Error(`Database creation failed: ${dbErr.trim()}`)
      }
      console.log(`✅ Database "${database}" verified/created.`)
    } else {
      console.log('\n1. Skipping database creation (using default).')
    }

    // 2. Create PageViews Table
    console.log(`\n2. Creating MergeTree table "${database}.${table}"...`)
    const ddl = `
      CREATE TABLE IF NOT EXISTS ${database}.${table} (
          id String,
          sessionId Nullable(String),
          url String,
          host String,
          path String,
          title Nullable(String),
          referrer Nullable(String),
          timestamp DateTime64(3),
          ua Nullable(String),
          browser Nullable(String),
          browserVersion Nullable(String),
          os Nullable(String),
          osVersion Nullable(String),
          engine Nullable(String),
          engineVersion Nullable(String),
          device Nullable(String),
          deviceModel Nullable(String),
          deviceType Nullable(String),
          isBot UInt8,
          botType Nullable(String),
          botName Nullable(String),
          ip Nullable(String),
          country Nullable(String),
          city Nullable(String),
          region Nullable(String),
          latitude Nullable(Float64),
          longitude Nullable(Float64),
          screenWidth Nullable(Int32),
          screenHeight Nullable(Int32),
          language Nullable(String),
          utmSource Nullable(String),
          utmMedium Nullable(String),
          utmCampaign Nullable(String),
          utmTerm Nullable(String),
          utmContent Nullable(String)
      ) ENGINE = MergeTree()
      ORDER BY (host, timestamp, id)
    `

    const tableRes = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers,
      body: ddl,
    })

    if (!tableRes.ok) {
      const tableErr = await tableRes.text()
      throw new Error(`Table creation failed: ${tableErr.trim()}`)
    }

    console.log(
      `✅ Table "${database}.${table}" successfully initialized and verified!`
    )
    console.log('\n🎉 ClickHouse configuration is 100% complete and ready!\n')
  } catch (err: any) {
    console.error(`\n❌ SCHEMA INITIALIZATION FAILED:`, err.message)
    console.error(
      'Please verify that the URL is correct and the account has DDL/admin permissions.\n'
    )
    process.exit(1)
  }
}

run()
