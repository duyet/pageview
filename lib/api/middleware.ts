/**
 * API Middleware Utilities
 * Reusable middleware for API routes
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { ZodError, type z } from 'zod'
import {
  methodNotAllowedResponse,
  validationErrorResponse,
  internalErrorResponse,
  handleOptions,
  setCorsHeaders,
} from './response'
import { formatZodError } from '../validation/schemas'
import { AppError, isAppError, logError } from '../errors/AppError'

/**
 * API Handler Type
 */
export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>

/**
 * Middleware Function Type
 */
export type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) => Promise<void>

/**
 * Method Handler Configuration
 */
export type MethodHandlers = {
  GET?: ApiHandler
  POST?: ApiHandler
  PUT?: ApiHandler
  PATCH?: ApiHandler
  DELETE?: ApiHandler
  OPTIONS?: ApiHandler
}

/**
 * Creates an API route handler with method routing
 */
export function createApiHandler(handlers: MethodHandlers): ApiHandler {
  return async (req, res) => {
    const method = req.method?.toUpperCase()

    // Handle OPTIONS for CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(res)
    }

    const handler = handlers[method as keyof MethodHandlers]

    if (!handler) {
      const allowedMethods = Object.keys(handlers).filter((m) => m !== 'OPTIONS')
      return methodNotAllowedResponse(res, allowedMethods)
    }

    try {
      await handler(req, res)
    } catch (error) {
      handleApiError(error, req, res)
    }
  }
}

/**
 * Validates request data with Zod schema
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req, res) => {
      try {
        const data =
          source === 'body' ? req.body : source === 'query' ? req.query : req.query

        const validated = schema.parse(data)

        // Attach validated data to request
        ;(req as any)[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] =
          validated

        await handler(req, res)
      } catch (error) {
        if (error instanceof ZodError) {
          const formatted = formatZodError(error)
          return validationErrorResponse(res, formatted.message, formatted.details)
        }
        throw error
      }
    }
  }
}

/**
 * CORS Middleware
 */
export function withCors(allowedOrigins: string[] = ['*']): Middleware {
  return async (req, res, next) => {
    setCorsHeaders(res, allowedOrigins)

    if (req.method === 'OPTIONS') {
      return handleOptions(res)
    }

    await next()
  }
}

/**
 * Error Handler
 */
export function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Log the error
  logError(error, {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
    },
  })

  // Handle AppError instances
  if (isAppError(error)) {
    return internalErrorResponse(res, error.message, error)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formatted = formatZodError(error)
    return validationErrorResponse(res, formatted.message, formatted.details)
  }

  // Handle generic errors
  if (error instanceof Error) {
    return internalErrorResponse(res, error.message, error)
  }

  // Fallback for unknown errors
  return internalErrorResponse(res, 'An unexpected error occurred', error)
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(...middlewares: Middleware[]): Middleware {
  return async (req, res, next) => {
    let index = 0

    const dispatch = async (): Promise<void> => {
      if (index >= middlewares.length) {
        return next()
      }

      const middleware = middlewares[index++]
      await middleware(req, res, dispatch)
    }

    await dispatch()
  }
}

/**
 * Adds request ID to request object
 */
export function withRequestId(): Middleware {
  return async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || nanoid()
    ;(req as any).requestId = requestId
    res.setHeader('X-Request-ID', requestId)
    await next()
  }
}

/**
 * Logs request information
 */
export function withRequestLogger(): Middleware {
  return async (req, res, next) => {
    const start = Date.now()

    console.log('[API Request]', {
      method: req.method,
      url: req.url,
      requestId: (req as any).requestId,
    })

    await next()

    const duration = Date.now() - start
    console.log('[API Response]', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: (req as any).requestId,
    })
  }
}

/**
 * Extract validated data from request
 */
export function getValidatedBody<T>(req: NextApiRequest): T {
  return (req as any).validatedBody
}

export function getValidatedQuery<T>(req: NextApiRequest): T {
  return (req as any).validatedQuery
}

export function getValidatedParams<T>(req: NextApiRequest): T {
  return (req as any).validatedParams
}

/**
 * Rate limiting middleware
 * Uses Upstash Redis for distributed rate limiting
 */
export function withRateLimit(
  rateLimiter: any // Ratelimit instance from @upstash/ratelimit
): Middleware {
  return async (req, res, next) => {
    // Skip if rate limiting not configured
    if (!rateLimiter) {
      console.warn('[Rate Limit] Redis not configured, skipping rate limiting')
      return next()
    }

    // Get identifier (IP address)
    const identifier = getRateLimitIdentifier(req)

    try {
      const { success, limit, remaining, reset } = await rateLimiter.limit(identifier)

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', reset.toString())

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        return rateLimitResponse(res, retryAfter)
      }

      await next()
    } catch (error) {
      // Log error but don't block request if rate limiting fails
      console.error('[Rate Limit] Error:', error)
      await next()
    }
  }
}

import { nanoid } from 'nanoid'
import { getRateLimitIdentifier } from '../ratelimit/config'
import { rateLimitResponse } from './response'
