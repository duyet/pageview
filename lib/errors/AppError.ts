/**
 * Custom Application Error Classes
 * Structured error handling with proper HTTP status codes
 */

import { ErrorCode } from '@/types/api'

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)

    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this)
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHORIZED, 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCode.FORBIDDEN, 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, ErrorCode.CONFLICT, 409)
    this.name = 'ConflictError'
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(
      message,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      retryAfter ? { retryAfter } : undefined
    )
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', originalError?: unknown) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      500,
      process.env.NODE_ENV === 'development' && originalError
        ? { originalError: String(originalError) }
        : undefined,
      true
    )
    this.name = 'DatabaseError'
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service unavailable',
    originalError?: unknown
  ) {
    super(
      message,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      {
        service,
        ...(process.env.NODE_ENV === 'development' && originalError
          ? { originalError: String(originalError) }
          : {}),
      },
      true
    )
    this.name = 'ExternalServiceError'
  }
}

/**
 * Timeout Error (504)
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', operation?: string) {
    super(message, ErrorCode.TIMEOUT, 504, operation ? { operation } : undefined)
    this.name = 'TimeoutError'
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(message, ErrorCode.BAD_REQUEST, 400, details)
    this.name = 'BadRequestError'
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}

/**
 * Error Handler Utility
 * Converts any error into an AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      false
    )
  }

  return new AppError(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    undefined,
    false
  )
}

/**
 * Log error with appropriate severity
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const normalizedError = normalizeError(error)

  const logData = {
    name: normalizedError.name,
    message: normalizedError.message,
    code: normalizedError.code,
    statusCode: normalizedError.statusCode,
    details: normalizedError.details,
    stack: normalizedError.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  if (normalizedError.isOperational) {
    console.warn('[Operational Error]', logData)
  } else {
    console.error('[Critical Error]', logData)
  }
}
