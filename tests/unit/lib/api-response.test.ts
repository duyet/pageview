/**
 * API Response Utilities Tests
 */

import { describe, it, expect, vi } from 'vitest'
import type { NextApiResponse } from 'next'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  createApiMeta,
} from '@/lib/api/response'

// Mock NextApiResponse
const createMockResponse = () => {
  const res: Partial<NextApiResponse> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  }
  return res as NextApiResponse
}

describe('API Response Utilities', () => {
  describe('createApiMeta', () => {
    it('should create API metadata with defaults', () => {
      const meta = createApiMeta()

      expect(meta).toHaveProperty('timestamp')
      expect(meta).toHaveProperty('requestId')
      expect(meta.version).toBe('v1')
    })

    it('should merge additional metadata', () => {
      const meta = createApiMeta({ page: { total: 100, page: 1, pageSize: 20, totalPages: 5, hasNextPage: true, hasPreviousPage: false } })

      expect(meta.page).toBeDefined()
      expect(meta.page?.total).toBe(100)
    })
  })

  describe('successResponse', () => {
    it('should send success response with 200', () => {
      const res = createMockResponse()
      const data = { message: 'Success' }

      successResponse(res, data)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          meta: expect.objectContaining({
            version: 'v1',
          }),
        })
      )
    })

    it('should accept custom status code', () => {
      const res = createMockResponse()

      successResponse(res, { id: '123' }, 201)

      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  describe('errorResponse', () => {
    it('should send error response with 500', () => {
      const res = createMockResponse()
      const error = {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      }

      errorResponse(res, error)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
        })
      )
    })
  })

  describe('validationErrorResponse', () => {
    it('should send 400 validation error', () => {
      const res = createMockResponse()

      validationErrorResponse(res, 'Validation failed', {
        email: ['Invalid email format'],
      })

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
          }),
        })
      )
    })
  })

  describe('notFoundResponse', () => {
    it('should send 404 not found', () => {
      const res = createMockResponse()

      notFoundResponse(res, 'User')

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'User not found',
          }),
        })
      )
    })
  })
})
