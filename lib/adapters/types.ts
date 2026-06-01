/**
 * Adapter Interface and PageView Event types
 */

export interface PageViewEvent {
  // Unique pageview/event ID
  id: string

  // Session ID for tracking user journeys/flow
  sessionId?: string | null

  // Target website URL info
  url: string
  host: string
  path: string
  title?: string | null
  referrer?: string | null
  timestamp: Date

  // User Agent parsed properties
  ua?: string | null
  browser?: string | null
  browserVersion?: string | null
  os?: string | null
  osVersion?: string | null
  engine?: string | null
  engineVersion?: string | null
  device?: string | null
  deviceModel?: string | null
  deviceType?: string | null
  isBot?: boolean
  botType?: string | null
  botName?: string | null

  // Geolocation properties
  ip?: string | null
  country?: string | null
  city?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null

  // Technical metadata
  screenWidth?: number | null
  screenHeight?: number | null
  language?: string | null

  // Marketing UTM attribution parameters
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
}

export interface PageViewAdapter {
  name: string
  enabled: boolean

  /**
   * Run initial setup (e.g., table creation if needed)
   */
  initialize(): Promise<void>

  /**
   * Broadcast pageview event to this adapter's storage engine
   */
  broadcast(event: PageViewEvent): Promise<void>
}
