/**
 * App Router Response Helpers
 * Lightweight wrappers for Next.js App Router Route Handlers.
 * Produces the same JSON envelope as the Pages Router response helpers.
 */

import { nanoid } from 'nanoid'
import type { ApiMeta } from '@/types/api'

function createMeta(extra?: Partial<ApiMeta>): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: nanoid(),
    version: 'v1',
    ...extra,
  }
}

interface SuccessOptions {
  /** Extra metadata merged into the default meta envelope. */
  meta?: Partial<ApiMeta>
  /** Additional headers on the Response. */
  headers?: Record<string, string>
}

/**
 * Success response (2xx)
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  options?: SuccessOptions
): Response {
  return Response.json(
    { success: true, data, meta: createMeta(options?.meta) },
    { status, headers: options?.headers }
  )
}

/**
 * Error response (4xx / 5xx)
 */
function errorResponse(
  error: { code: string; message: string; details?: Record<string, unknown> },
  status: number,
  headers?: Record<string, string>
): Response {
  return Response.json(
    { success: false, error, meta: createMeta() },
    { status, headers }
  )
}

/**
 * 400 Bad Request
 */
export function badRequestResponse(
  message: string = 'Bad request',
  details?: Record<string, unknown>
): Response {
  return errorResponse({ code: 'BAD_REQUEST', message, details }, 400)
}

/**
 * 404 Not Found
 */
export function notFoundResponse(
  resource: string = 'Resource'
): Response {
  return errorResponse(
    { code: 'NOT_FOUND', message: `${resource} not found` },
    404
  )
}

/**
 * 503 Service Unavailable
 */
export function serviceUnavailableResponse(
  message: string = 'Service temporarily unavailable'
): Response {
  return errorResponse(
    { code: 'SERVICE_UNAVAILABLE', message },
    503
  )
}
