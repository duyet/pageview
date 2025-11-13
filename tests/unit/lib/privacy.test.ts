/**
 * Privacy Utilities Tests
 */

import { describe, it, expect } from 'vitest'
import {
  hashIp,
  anonymizeIp,
  isValidIp,
  isBotUserAgent,
} from '@/lib/privacy/hash'

describe('Privacy Utilities', () => {
  describe('hashIp', () => {
    it('should hash IP addresses consistently', () => {
      const ip = '192.168.1.1'
      const hash1 = hashIp(ip)
      const hash2 = hashIp(ip)

      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(ip)
      expect(hash1?.length).toBe(64) // SHA-256 hex length
    })

    it('should return null for invalid IPs', () => {
      expect(hashIp(null)).toBeNull()
      expect(hashIp(undefined)).toBeNull()
      expect(hashIp('')).toBeNull()
      expect(hashIp('unknown')).toBeNull()
    })

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIp('192.168.1.1')
      const hash2 = hashIp('192.168.1.2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('anonymizeIp', () => {
    it('should anonymize IPv4 addresses', () => {
      expect(anonymizeIp('192.168.1.100')).toBe('192.168.1.0')
    })

    it('should anonymize IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      const anonymized = anonymizeIp(ipv6)

      expect(anonymized).toContain('::0')
    })

    it('should return null for invalid inputs', () => {
      expect(anonymizeIp(null)).toBeNull()
      expect(anonymizeIp('')).toBeNull()
    })
  })

  describe('isValidIp', () => {
    it('should validate IPv4 addresses', () => {
      expect(isValidIp('192.168.1.1')).toBe(true)
      expect(isValidIp('255.255.255.255')).toBe(true)
      expect(isValidIp('0.0.0.0')).toBe(true)
    })

    it('should reject invalid IPv4', () => {
      expect(isValidIp('256.1.1.1')).toBe(false)
      expect(isValidIp('192.168.1')).toBe(false)
      expect(isValidIp('not-an-ip')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isValidIp(null)).toBe(false)
      expect(isValidIp(undefined)).toBe(false)
    })
  })

  describe('isBotUserAgent', () => {
    it('should detect bot user agents', () => {
      expect(isBotUserAgent('Googlebot/2.1')).toBe(true)
      expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0')).toBe(true)
      expect(isBotUserAgent('curl/7.64.1')).toBe(true)
    })

    it('should not flag normal browsers', () => {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      expect(isBotUserAgent(chromeUA)).toBe(false)
    })

    it('should handle null/undefined', () => {
      expect(isBotUserAgent(null)).toBe(false)
      expect(isBotUserAgent(undefined)).toBe(false)
    })
  })
})
