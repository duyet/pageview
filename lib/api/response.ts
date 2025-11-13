/**
 * Standardized API Response Utilities
 * Consistent response formatting across all endpoints
 */

import { NextApiResponse } from 'next'
import type { ApiResponse, ApiError, ApiMeta, HttpStatus } from '@/types/api'
import { nanoid } from 'nanoid'

/**
 * Creates standardized API metadata
 */
export function createApiMeta(additionalMeta?: Partial<ApiMeta>): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: nanoid(),
    version: 'v1',
    ...additionalMeta,
  }
}

/**
 * Success Response
 */
export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  status: number = 200,
  meta?: Partial<ApiMeta>
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: createApiMeta(meta),
  }

  res.status(status).json(response)
}

/**
 * Error Response
 */
export function errorResponse(
  res: NextApiResponse,
  error: ApiError,
  status: number = 500,
  meta?: Partial<ApiMeta>
): void {
  const response: ApiResponse = {
    success: false,
    error,
    meta: createApiMeta(meta),
  }

  res.status(status).json(response)
}

/**
 * Validation Error Response (400)
 */
export function validationErrorResponse(
  res: NextApiResponse,
  message: string = 'Validation failed',
  details?: Record<string, unknown>
): void {
  errorResponse(
    res,
    {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
    400
  )
}

/**
 * Not Found Response (404)
 */
export function notFoundResponse(
  res: NextApiResponse,
  resource: string = 'Resource'
): void {
  errorResponse(
    res,
    {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    },
    404
  )
}

/**
 * Unauthorized Response (401)
 */
export function unauthorizedResponse(
  res: NextApiResponse,
  message: string = 'Unauthorized'
): void {
  errorResponse(
    res,
    {
      code: 'UNAUTHORIZED',
      message,
    },
    401
  )
}

/**
 * Forbidden Response (403)
 */
export function forbiddenResponse(
  res: NextApiResponse,
  message: string = 'Forbidden'
): void {
  errorResponse(
    res,
    {
      code: 'FORBIDDEN',
      message,
    },
    403
  )
}

/**
 * Rate Limit Response (429)
 */
export function rateLimitResponse(
  res: NextApiResponse,
  retryAfter?: number
): void {
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter.toString())
  }

  errorResponse(
    res,
    {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      details: retryAfter ? { retryAfter } : undefined,
    },
    429
  )
}

/**
 * Internal Server Error Response (500)
 */
export function internalErrorResponse(
  res: NextApiResponse,
  message: string = 'Internal server error',
  error?: unknown
): void {
  // Log the actual error for debugging
  if (error) {
    console.error('[Internal Error]', error)
  }

  // Don't expose internal error details to client in production
  const details =
    process.env.NODE_ENV === 'development' && error
      ? { error: String(error) }
      : undefined

  errorResponse(
    res,
    {
      code: 'INTERNAL_ERROR',
      message,
      details,
    },
    500
  )
}

/**
 * Method Not Allowed Response (405)
 */
export function methodNotAllowedResponse(
  res: NextApiResponse,
  allowedMethods: string[]
): void {
  res.setHeader('Allow', allowedMethods.join(', '))

  errorResponse(
    res,
    {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      details: { allowedMethods },
    },
    405
  )
}

/**
 * Bad Request Response (400)
 */
export function badRequestResponse(
  res: NextApiResponse,
  message: string = 'Bad request',
  details?: Record<string, unknown>
): void {
  errorResponse(
    res,
    {
      code: 'BAD_REQUEST',
      message,
      details,
    },
    400
  )
}

/**
 * Conflict Response (409)
 */
export function conflictResponse(
  res: NextApiResponse,
  message: string = 'Resource already exists'
): void {
  errorResponse(
    res,
    {
      code: 'CONFLICT',
      message,
    },
    409
  )
}

/**
 * Service Unavailable Response (503)
 */
export function serviceUnavailableResponse(
  res: NextApiResponse,
  message: string = 'Service temporarily unavailable'
): void {
  errorResponse(
    res,
    {
      code: 'SERVICE_UNAVAILABLE',
      message,
    },
    503
  )
}

/**
 * Paginated Response
 */
export function paginatedResponse<T>(
  res: NextApiResponse,
  data: T[],
  pagination: {
    total: number
    page: number
    pageSize: number
  }
): void {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  successResponse(res, data, 200, {
    page: {
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  })
}

/**
 * No Content Response (204)
 */
export function noContentResponse(res: NextApiResponse): void {
  res.status(204).end()
}

/**
 * Created Response (201)
 */
export function createdResponse<T>(
  res: NextApiResponse,
  data: T,
  location?: string
): void {
  if (location) {
    res.setHeader('Location', location)
  }

  successResponse(res, data, 201)
}

/**
 * Async Handler Wrapper
 * Catches async errors and returns proper error response
 */
export function asyncHandler(
  handler: (req: any, res: NextApiResponse) => Promise<void>
) {
  return async (req: any, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('[API Error]', error)

      if (error instanceof Error) {
        internalErrorResponse(res, error.message, error)
      } else {
        internalErrorResponse(res, 'An unexpected error occurred', error)
      }
    }
  }
}

/**
 * CORS Headers
 */
export function setCorsHeaders(
  res: NextApiResponse,
  allowedOrigins: string[] = ['*']
): void {
  const origin = allowedOrigins.includes('*') ? '*' : allowedOrigins.join(', ')

  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
}

/**
 * Handle OPTIONS preflight
 */
export function handleOptions(res: NextApiResponse): void {
  setCorsHeaders(res)
  noContentResponse(res)
}
