import { PageViewAdapter, PageViewEvent } from './types'

export class ClickHouseAdapter implements PageViewAdapter {
  name = 'ClickHouse'
  enabled = !!process.env.CLICKHOUSE_URL

  private connectionUrl = process.env.CLICKHOUSE_URL || ''
  private database = 'default'
  private table = 'pageviews'
  private endpoint = ''
  private authHeader = ''

  constructor() {
    if (this.enabled) {
      this.parseUrl()
    }
  }

  private parseUrl() {
    try {
      const parsed = new URL(this.connectionUrl)

      // Extract custom database name from path, default to 'default'
      const pathDb = parsed.pathname.replace(/^\//, '')
      this.database = parsed.searchParams.get('database') || pathDb || 'default'

      // Extract custom table name from search params, default to 'pageviews'
      this.table = parsed.searchParams.get('table') || 'pageviews'

      // Construct ClickHouse HTTP endpoint without credentials
      const targetUrl = new URL(parsed.origin)
      targetUrl.pathname = '/'
      targetUrl.searchParams.set(
        'query',
        `INSERT INTO ${this.database}.${this.table} FORMAT JSONEachRow`
      )
      this.endpoint = targetUrl.toString()

      // Parse and construct basic authentication
      if (parsed.username || parsed.password) {
        const credentials = Buffer.from(
          `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`
        ).toString('base64')
        this.authHeader = `Basic ${credentials}`
      }
    } catch (err) {
      console.error('ClickHouse URL parsing failed, disabling adapter:', err)
      this.enabled = false
    }
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return

    console.log(
      `ClickHouse HTTP Adapter configured for database: "${this.database}", table: "${this.table}"`
    )

    // In production, the schema is already provisioned — skip DDL to avoid
    // slow cold-start latency (5-8s) that causes Prisma transaction timeouts.
    if (process.env.NODE_ENV === 'production') {
      console.log(
        `[ClickHouse] Production mode: skipping DDL initialization. Schema assumed to be pre-provisioned.`
      )
      return
    }

    try {
      const parsed = new URL(this.connectionUrl)
      const targetUrl = new URL(parsed.origin)
      targetUrl.pathname = '/'

      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
      }

      if (this.authHeader) {
        headers['Authorization'] = this.authHeader
      }

      // 1. Auto-create database if not using 'default'
      if (this.database && this.database !== 'default') {
        console.log(
          `[ClickHouse] Attempting to auto-create database "${this.database}" if not exists...`
        )
        const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${this.database}`
        const dbRes = await fetch(targetUrl.toString(), {
          method: 'POST',
          headers,
          body: createDbQuery,
        })
        if (!dbRes.ok) {
          const dbErr = await dbRes.text()
          console.warn(
            `[ClickHouse] Database auto-creation warning (could be permission related):`,
            dbErr
          )
        } else {
          console.log(
            `[ClickHouse] Database "${this.database}" verified/created.`
          )
        }
      }

      // 2. Auto-create table
      console.log(
        `[ClickHouse] Attempting to auto-create table "${this.database}.${this.table}" if not exists...`
      )
      const ddl = `
        CREATE TABLE IF NOT EXISTS ${this.database}.${this.table} (
            id String,
            sessionId Nullable(String),
            url String,
            host LowCardinality(String),
            path String,
            title Nullable(String),
            referrer Nullable(String),
            timestamp DateTime64(3),
            ua Nullable(String),
            browser LowCardinality(Nullable(String)),
            browserVersion LowCardinality(Nullable(String)),
            os LowCardinality(Nullable(String)),
            osVersion LowCardinality(Nullable(String)),
            engine LowCardinality(Nullable(String)),
            engineVersion LowCardinality(Nullable(String)),
            device LowCardinality(Nullable(String)),
            deviceModel Nullable(String),
            deviceType LowCardinality(Nullable(String)),
            isBot UInt8,
            botType LowCardinality(Nullable(String)),
            botName LowCardinality(Nullable(String)),
            ip Nullable(String),
            country LowCardinality(Nullable(String)),
            city LowCardinality(Nullable(String)),
            region LowCardinality(Nullable(String)),
            latitude Nullable(Float64),
            longitude Nullable(Float64),
            screenWidth Nullable(Int32),
            screenHeight Nullable(Int32),
            language LowCardinality(Nullable(String)),
            utmSource LowCardinality(Nullable(String)),
            utmMedium LowCardinality(Nullable(String)),
            utmCampaign LowCardinality(Nullable(String)),
            utmTerm LowCardinality(Nullable(String)),
            utmContent LowCardinality(Nullable(String))
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
        console.warn(
          `[ClickHouse] Table auto-creation warning (could be permission related):`,
          tableErr
        )
      } else {
        console.log(
          `[ClickHouse] Table "${this.database}.${this.table}" verified/created successfully.`
        )
      }
    } catch (err: any) {
      console.warn(
        '[ClickHouse] Automatic schema initialization failed or was skipped:',
        err.message
      )
    }
  }

  async broadcast(event: PageViewEvent): Promise<void> {
    if (!this.enabled) return

    try {
      // Map event model properties to a clean flat JSON representation for ClickHouse
      const record = {
        id: event.id,
        sessionId: event.sessionId || null,
        url: event.url,
        host: event.host,
        path: event.path,
        title: event.title || null,
        referrer: event.referrer || null,
        timestamp: event.timestamp
          .toISOString()
          .replace('T', ' ')
          .replace('Z', ''),
        ua: event.ua || null,
        browser: event.browser || null,
        browserVersion: event.browserVersion || null,
        os: event.os || null,
        osVersion: event.osVersion || null,
        engine: event.engine || null,
        engineVersion: event.engineVersion || null,
        device: event.device || null,
        deviceModel: event.deviceModel || null,
        deviceType: event.deviceType || null,
        isBot: event.isBot ? 1 : 0,
        botType: event.botType || null,
        botName: event.botName || null,
        ip: event.ip || null,
        country: event.country || null,
        city: event.city || null,
        region: event.region || null,
        latitude: event.latitude || null,
        longitude: event.longitude || null,
        screenWidth: event.screenWidth || null,
        screenHeight: event.screenHeight || null,
        language: event.language || null,
        utmSource: event.utmSource || null,
        utmMedium: event.utmMedium || null,
        utmCampaign: event.utmCampaign || null,
        utmTerm: event.utmTerm || null,
        utmContent: event.utmContent || null,
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (this.authHeader) {
        headers['Authorization'] = this.authHeader
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(record) + '\n',
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(
          `HTTP status ${response.status} ${response.statusText}: ${text}`
        )
      }
    } catch (err) {
      console.error('ClickHouse broadcast failed:', err)
      // Throwing error allows the orchestrator to capture settled promises and log failures
      throw err
    }
  }
}
