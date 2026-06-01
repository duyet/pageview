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
    console.log(`Suggested ClickHouse Table DDL:
      CREATE TABLE IF NOT EXISTS ${this.database}.${this.table} (
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
    `)
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
        timestamp: event.timestamp.toISOString(),
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
