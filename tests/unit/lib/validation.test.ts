/**
 * Validation Schema Tests
 */

import { describe, it, expect } from 'vitest'
import {
  pageviewTrackingSchema,
  analyticsTrendsQuerySchema,
  formatZodError,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('pageviewTrackingSchema', () => {
    it('should validate valid pageview data', () => {
      const validData = {
        url: 'https://example.com/page',
        referrer: 'https://google.com',
      }

      const result = pageviewTrackingSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL format', () => {
      const invalidData = {
        url: 'not-a-url',
      }

      const result = pageviewTrackingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject URLs longer than 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050)

      const result = pageviewTrackingSchema.safeParse({ url: longUrl })
      expect(result.success).toBe(false)
    })
  })

  describe('analyticsTrendsQuerySchema', () => {
    it('should accept valid days parameter', () => {
      const validData = { days: 30 }

      const result = analyticsTrendsQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      expect(result.data?.days).toBe(30)
    })

    it('should reject days > 365', () => {
      const invalidData = { days: 400 }

      const result = analyticsTrendsQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should use default values', () => {
      const result = analyticsTrendsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      expect(result.data?.interval).toBe('day')
    })
  })

  describe('formatZodError', () => {
    it('should format Zod errors properly', () => {
      const result = pageviewTrackingSchema.safeParse({ url: 'invalid' })

      if (!result.success) {
        const formatted = formatZodError(result.error)

        expect(formatted.code).toBe('VALIDATION_ERROR')
        expect(formatted.message).toBe('Validation failed')
        expect(formatted.details).toHaveProperty('url')
      }
    })
  })
})
