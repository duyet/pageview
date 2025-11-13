/**
 * Centralized API Type Definitions
 * Standard request/response types for all API endpoints
 */

/**
 * Standard API Response Wrapper
 * Used across all API endpoints for consistency
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta: ApiMeta
}

/**
 * API Error Object
 * Structured error information for client consumption
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string // For validation errors
}

/**
 * API Metadata
 * Additional information about the response
 */
export interface ApiMeta {
  timestamp: string
  requestId: string
  version: string
  page?: PaginationMeta
}

/**
 * Pagination Metadata
 * Used for paginated endpoints
 */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Pagination Request Parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
}

/**
 * Sort Parameters
 */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Filter Parameters
 */
export interface FilterParams {
  search?: string
  startDate?: string
  endDate?: string
}

/**
 * Common Query Parameters
 * Extends pagination, sorting, and filtering
 */
export interface QueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {}

/**
 * Pageview Tracking Request
 */
export interface PageviewTrackingRequest {
  url: string
  referrer?: string
  userAgent?: string
}

/**
 * Analytics Date Range Request
 */
export interface AnalyticsDateRangeRequest {
  startDate?: string
  endDate?: string
  days?: number
  domain?: string
}

/**
 * Trend Data Point
 */
export interface TrendDataPoint {
  date: string
  pageviews: number
  uniqueVisitors: number
}

/**
 * Device Analytics
 */
export interface DeviceAnalytics {
  browser: string
  os: string
  device: string
  count: number
  percentage: number
}

/**
 * Location Analytics
 */
export interface LocationAnalytics {
  country: string
  countryName: string
  city?: string
  count: number
  percentage: number
}

/**
 * Domain Statistics
 */
export interface DomainStats {
  domain: string
  totalPageviews: number
  uniqueVisitors: number
  urls: number
  trend?: number
  lastPageview?: string
}

/**
 * URL Statistics
 */
export interface UrlStats {
  id: string
  url: string
  domain: string
  path: string
  totalPageviews: number
  uniqueVisitors: number
  trend?: number
  lastPageview?: string
  avgTimeOnPage?: number
}

/**
 * Real-time Metrics
 */
export interface RealtimeMetrics {
  activeVisitors: number
  pageviewsLast24h: number
  uniqueVisitorsLast24h: number
  topPages: Array<{
    url: string
    count: number
  }>
  recentPageviews: Array<{
    url: string
    country: string
    timestamp: string
    browser: string
  }>
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  database: {
    connected: boolean
    latency?: number
  }
  redis?: {
    connected: boolean
    latency?: number
  }
}

/**
 * Error Codes
 * Standardized error codes for the API
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * API Version
 */
export const API_VERSION = 'v1' as const

/**
 * HTTP Status Codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}
