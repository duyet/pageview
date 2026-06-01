import fs from 'fs'
import path from 'path'
import { PageViewAdapter, PageViewEvent } from './types'

export class MotherDuckAdapter implements PageViewAdapter {
  name = 'MotherDuck'
  enabled =
    !!process.env.MOTHERDUCK_TOKEN || process.env.ENABLE_DUCKDB === 'true'

  private db: any = null
  private connection: any = null
  private isNativeAvailable = false
  private localBufferPath = ''
  private databaseName = 'my_db'
  private tableName = 'pageviews'

  constructor() {
    if (this.enabled) {
      this.databaseName = process.env.MOTHERDUCK_DATABASE || 'my_db'
      this.tableName = process.env.MOTHERDUCK_TABLE || 'pageviews'

      // Determine local mock buffer path in case native DuckDB bindings are missing
      const baseDir = process.cwd()
      this.localBufferPath = path.join(
        baseDir,
        '.antigravitycli',
        'duckdb_buffer.jsonl'
      )
    }
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return

    console.log(
      `MotherDuck/DuckDB Adapter initializing... Target Table: "${this.databaseName}.${this.tableName}"`
    )

    // Print SQL DDL statement for DuckDB/MotherDuck setup
    console.log(`Suggested MotherDuck/DuckDB Schema DDL:
      CREATE TABLE IF NOT EXISTS ${this.databaseName}.${this.tableName} (
          id VARCHAR,
          sessionId VARCHAR,
          url VARCHAR,
          host VARCHAR,
          path VARCHAR,
          title VARCHAR,
          referrer VARCHAR,
          timestamp TIMESTAMP,
          ua VARCHAR,
          browser VARCHAR,
          browserVersion VARCHAR,
          os VARCHAR,
          osVersion VARCHAR,
          engine VARCHAR,
          engineVersion VARCHAR,
          device VARCHAR,
          deviceModel VARCHAR,
          deviceType VARCHAR,
          isBot BOOLEAN,
          botType VARCHAR,
          botName VARCHAR,
          ip VARCHAR,
          country VARCHAR,
          city VARCHAR,
          region VARCHAR,
          latitude DOUBLE,
          longitude DOUBLE,
          screenWidth INTEGER,
          screenHeight INTEGER,
          language VARCHAR,
          utmSource VARCHAR,
          utmMedium VARCHAR,
          utmCampaign VARCHAR,
          utmTerm VARCHAR,
          utmContent VARCHAR
      );
    `)

    try {
      // Try to load duckdb native driver
      // eslint-disable-next-line
      const duckdb = require('duckdb')

      if (duckdb && duckdb.Database) {
        this.isNativeAvailable = true

        let connectionString = 'pageviews.db' // local fallback DuckDB file

        if (process.env.MOTHERDUCK_TOKEN) {
          // Connect to MotherDuck
          connectionString = `md:${this.databaseName}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`
          console.log('Connecting to MotherDuck Cloud...')
        } else {
          console.log('Using local DuckDB file database...')
        }

        this.db = new duckdb.Database(connectionString)
        this.connection = this.db.connect()

        // Try creating table inside DuckDB
        this.connection.run(
          `
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
              id VARCHAR,
              sessionId VARCHAR,
              url VARCHAR,
              host VARCHAR,
              path VARCHAR,
              title VARCHAR,
              referrer VARCHAR,
              timestamp TIMESTAMP,
              ua VARCHAR,
              browser VARCHAR,
              browserVersion VARCHAR,
              os VARCHAR,
              osVersion VARCHAR,
              engine VARCHAR,
              engineVersion VARCHAR,
              device VARCHAR,
              deviceModel VARCHAR,
              deviceType VARCHAR,
              isBot BOOLEAN,
              botType VARCHAR,
              botName VARCHAR,
              ip VARCHAR,
              country VARCHAR,
              city VARCHAR,
              region VARCHAR,
              latitude DOUBLE,
              longitude DOUBLE,
              screenWidth INTEGER,
              screenHeight INTEGER,
              language VARCHAR,
              utmSource VARCHAR,
              utmMedium VARCHAR,
              utmCampaign VARCHAR,
              utmTerm VARCHAR,
              utmContent VARCHAR
          );
        `,
          (err: any) => {
            if (err) {
              console.error('MotherDuck table auto-creation failed:', err)
            } else {
              console.log('MotherDuck table verified/created successfully.')
            }
          }
        )
      }
    } catch (e) {
      console.warn(
        'duckdb native module is not installed or failed to load. MotherDuck Adapter will run in mock JSONL buffer mode at ' +
          this.localBufferPath
      )
      this.isNativeAvailable = false

      // Ensure buffer directory exists
      try {
        const dir = path.dirname(this.localBufferPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      } catch (err) {
        // Silently ignore or log directory creation errors
      }
    }
  }

  async broadcast(event: PageViewEvent): Promise<void> {
    if (!this.enabled) return

    const flatRecord = {
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
      isBot: !!event.isBot,
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

    if (this.isNativeAvailable && this.connection) {
      return new Promise<void>((resolve, reject) => {
        // Build safe SQL parameter inserts for DuckDB
        const keys = Object.keys(flatRecord)
        const placeholders = keys.map(() => '?').join(', ')
        const values = Object.values(flatRecord)

        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`

        this.connection.run(query, ...values, (err: any) => {
          if (err) {
            console.error('MotherDuck insert query failed:', err)
            reject(err)
          } else {
            resolve()
          }
        })
      })
    } else {
      // Fallback mode: Write events to a local JSONL file to act as an offline DuckDB data buffer
      try {
        const line = JSON.stringify(flatRecord) + '\n'
        await fs.promises.appendFile(this.localBufferPath, line, 'utf-8')

        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[MotherDuck Mock] Buffered 1 pageview event to local JSONL.'
          )
        }
      } catch (err) {
        console.error('MotherDuck Mock fallback append failed:', err)
        throw err
      }
    }
  }
}
