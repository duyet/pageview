/**
 * Rate Limiting Configuration
 * Using Upstash Redis for distributed rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Redis client (configured via environment variables)
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : undefined

/**
 * Rate limiter for tracking endpoint
 * 1000 requests per minute per IP
 */
export const trackingRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      analytics: true,
      prefix: 'ratelimit:tracking',
    })
  : null

/**
 * Rate limiter for analytics endpoints
 * 100 requests per minute per IP
 */
export const analyticsRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:analytics',
    })
  : null

/**
 * Rate limiter for realtime endpoints
 * 60 requests per minute per IP (every second)
 */
export const realtimeRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:realtime',
    })
  : null

/**
 * Strict rate limiter for API abuse prevention
 * 10 requests per minute per IP
 */
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : null

/**
 * Get identifier for rate limiting (IP address)
 */
export function getRateLimitIdentifier(req: any): string {
  // Try various IP sources
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const ip = req.socket?.remoteAddress

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    const ips = (forwarded as string).split(',')
    return ips[0].trim()
  }

  return (realIp as string) || ip || 'unknown'
}

/**
 * Check if Redis is configured
 */
export function isRateLimitingEnabled(): boolean {
  return !!redis
}
