/**
 * Domain Model Types
 * TypeScript types for database models (extends Prisma types)
 */

/**
 * Enriched PageView with relationships
 */
export interface PageViewWithRelations {
  id: string
  createdAt: Date

  // URL information
  url: {
    id: string
    full: string
    host: {
      domain: string
    }
    slug: string
  }

  // User Agent information
  ua?: {
    browser: string
    os: string
    device: string
  }

  // Location information
  country?: {
    code: string
    name: string
  }
  city?: {
    name: string
  }
}

/**
 * Aggregated Domain Analytics
 */
export interface DomainAnalytics {
  domain: string
  totalPageviews: number
  uniqueVisitors: number
  urls: number
  avgSessionDuration?: number
  bounceRate?: number
  topReferrers: Array<{
    url: string
    count: number
  }>
  topPages: Array<{
    url: string
    count: number
  }>
}

/**
 * Time Series Data
 */
export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
}

/**
 * Geo Data
 */
export interface GeoData {
  country?: string
  countryName?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
}

/**
 * User Agent Data
 */
export interface UserAgentData {
  ua: string
  browser: string
  browserVersion?: string
  os: string
  osVersion?: string
  device: string
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot'
}

/**
 * Tracking Session
 */
export interface TrackingSession {
  id: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageviews: number
  referrer?: string
}

/**
 * Analytics Filter
 */
export interface AnalyticsFilter {
  domain?: string
  url?: string
  startDate?: Date
  endDate?: Date
  country?: string
  device?: string
  browser?: string
}

/**
 * Date Range Preset
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

/**
 * Export Format
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx'

/**
 * Aggregation Interval
 */
export type AggregationInterval = 'hour' | 'day' | 'week' | 'month'
