/**
 * Zod Validation Schemas
 * Runtime validation for all API endpoints
 */

import { z } from 'zod'

/**
 * Common Schemas
 */

// URL validation
export const urlSchema = z
  .string()
  .url({ message: 'Invalid URL format' })
  .max(2048, 'URL must be less than 2048 characters')

// Domain validation
export const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .max(255)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/, 'Invalid domain format')

// Date validation
export const dateSchema = z.string().datetime().or(z.string().date())

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
})

// Sort validation
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Date range validation
export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
})

/**
 * Tracking Endpoint Schemas
 */

// POST /api/v1/tracking/pageview
export const pageviewTrackingSchema = z.object({
  url: urlSchema,
  referrer: urlSchema.optional().or(z.literal('')),
  userAgent: z.string().max(500).optional(),
})

// Event tracking (for future use)
export const eventTrackingSchema = z.object({
  name: z.string().min(1).max(100),
  url: urlSchema,
  properties: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Analytics Endpoint Schemas
 */

// GET /api/v1/analytics/domains
export const analyticsDomainsQuerySchema = paginationSchema
  .merge(sortSchema)
  .merge(
    z.object({
      search: z.string().optional(),
    })
  )

// GET /api/v1/analytics/domains/:domain
export const analyticsDomainParamsSchema = z.object({
  domain: domainSchema,
})

export const analyticsDomainQuerySchema = dateRangeSchema
  .merge(paginationSchema)
  .merge(sortSchema)

// GET /api/v1/analytics/urls/:urlId
export const analyticsUrlParamsSchema = z.object({
  urlId: z.string().cuid(),
})

export const analyticsUrlQuerySchema = dateRangeSchema

// GET /api/v1/analytics/trends
export const analyticsTrendsQuerySchema = dateRangeSchema.merge(
  z.object({
    domain: domainSchema.optional(),
    interval: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  })
)

// GET /api/v1/analytics/devices
export const analyticsDevicesQuerySchema = dateRangeSchema.merge(
  z.object({
    domain: domainSchema.optional(),
    type: z.enum(['browser', 'os', 'device']).optional(),
  })
)

// GET /api/v1/analytics/locations
export const analyticsLocationsQuerySchema = dateRangeSchema.merge(
  z.object({
    domain: domainSchema.optional(),
    type: z.enum(['country', 'city']).default('country'),
  })
)

/**
 * Real-time Endpoint Schemas
 */

// GET /api/v1/realtime/metrics
export const realtimeMetricsQuerySchema = z.object({
  domain: domainSchema.optional(),
})

/**
 * Admin Endpoint Schemas
 */

// GET /api/v1/admin/stats
export const adminStatsQuerySchema = z.object({
  includeDetails: z.coerce.boolean().default(false),
})

/**
 * Validation Helpers
 */

/**
 * Validates request body
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data)
}

/**
 * Validates query parameters
 * Coerces strings to appropriate types
 */
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data)
}

/**
 * Validates route parameters
 */
export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data)
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Formats Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): {
  code: string
  message: string
  details: Record<string, string[]>
} {
  const details: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!details[path]) {
      details[path] = []
    }
    details[path].push(err.message)
  })

  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details,
  }
}
