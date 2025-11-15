/**
 * Redis Cache Layer
 * For caching analytics data
 */

import { Redis } from '@upstash/redis'

/**
 * Redis client (configured via environment variables)
 */
export const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATION = {
  REALTIME: 30, // 30 seconds
  ANALYTICS: 300, // 5 minutes
  TRENDS: 600, // 10 minutes
  DOMAINS: 120, // 2 minutes
} as const

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null

  try {
    const data = await redis.get(key)
    return data as T | null
  } catch (error) {
    console.error('[Cache] Get error:', error)
    return null
  }
}

/**
 * Set cached data with TTL
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = CACHE_DURATION.ANALYTICS
): Promise<void> {
  if (!redis) return

  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('[Cache] Set error:', error)
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('[Cache] Invalidate error:', error)
  }
}

/**
 * Generate cache key
 */
export function cacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `pageview:${prefix}:${parts.join(':')}`
}

/**
 * Cache wrapper helper
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key)
  if (cached !== null) {
    console.log('[Cache] HIT:', key)
    return cached
  }

  // Fetch fresh data
  console.log('[Cache] MISS:', key)
  const data = await fetcher()

  // Cache it
  await setCached(key, data, ttl)

  return data
}
