/**
 * POST /api/v1/tracking/pageview
 * Track a pageview with privacy-compliant IP hashing
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import normalizeUrl from 'normalize-url'
import { createApiHandler, withRateLimit } from '@/lib/api/middleware'
import { successResponse, badRequestResponse } from '@/lib/api/response'
import { trackingRateLimiter } from '@/lib/ratelimit/config'
import { hashIp, isBotUserAgent } from '@/lib/privacy/hash'
import prisma from '@/lib/prisma'

/**
 * Extract URL from request (body, query, or referer header)
 */
function extractUrl(req: NextApiRequest): string | null {
  // Priority 1: Request body
  if (req.body?.url) {
    console.log('[Tracking] URL from body:', req.body.url)
    return req.body.url
  }

  // Priority 2: Query parameter
  if (req.query.url) {
    const url = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
    console.log('[Tracking] URL from query:', url)
    return url
  }

  // Priority 3: Referer header
  if (req.headers.referer) {
    console.log('[Tracking] URL from referer:', req.headers.referer)
    return req.headers.referer
  }

  return null
}

/**
 * Parse user agent data from middleware query params
 */
function parseUserAgent(req: NextApiRequest) {
  return {
    ua: String(req.query.ua || ''),
    browser: String(req.query.browser || ''),
    browserVersion: String(req.query.browserVersion || ''),
    os: String(req.query.os || ''),
    osVersion: String(req.query.osVersion || ''),
    engine: String(req.query.engine || ''),
    engineVersion: String(req.query.engineVersion || ''),
    device: String(req.query.device || ''),
    deviceModel: String(req.query.deviceModel || ''),
    deviceType: String(req.query.deviceType || ''),
    isBot: req.query.isBot === 'true',
  }
}

/**
 * POST handler with rate limiting
 */
const postHandlerBase = async (req: NextApiRequest, res: NextApiResponse) => {
  // Extract URL from request
  const url = extractUrl(req)

  if (!url) {
    return badRequestResponse(
      res,
      'URL is required (provide via body, query, or referer header)'
    )
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    return badRequestResponse(res, 'Invalid URL format')
  }

  // Check if bot (optional filtering)
  const userAgentString = String(
    req.query.ua || req.headers['user-agent'] || ''
  )
  const isBot = isBotUserAgent(userAgentString)

  if (isBot) {
    console.log('[Tracking] Bot detected, skipping:', userAgentString)
    // Still return success to not break the tracking script
    return successResponse(
      res,
      { id: 'bot-filtered', timestamp: new Date().toISOString() },
      201
    )
  }

  // Normalize URL (remove tracking parameters)
  const normalizedUrl = normalizeUrl(url, {
    removeQueryParameters: [
      /^utm_\w+/i,
      'fbclid',
      'ref',
      'ref_src',
      'gclid',
      'mc_',
      'source',
    ],
  })

  console.log(`[Tracking] Normalized: ${url} -> ${normalizedUrl}`)

  const parsedUrl = new URL(normalizedUrl)
  const userAgent = parseUserAgent(req)

  // Hash IP address for privacy compliance (GDPR)
  const rawIp = req.query.ip ? String(req.query.ip) : null
  const ipHash = hashIp(rawIp)

  console.log(
    `[Tracking] IP hashed: ${rawIp?.substring(0, 8)}... -> ${ipHash?.substring(0, 16)}...`
  )

  // Create pageview record with normalized relationships
  try {
    const pageview = await prisma.pageView.create({
      data: {
        // URL relationship (normalized)
        url: {
          connectOrCreate: {
            where: { url: normalizedUrl },
            create: {
              url: normalizedUrl,
              host: {
                connectOrCreate: {
                  where: { host: parsedUrl.hostname },
                  create: { host: parsedUrl.hostname },
                },
              },
              slug: {
                connectOrCreate: {
                  where: { slug: parsedUrl.pathname },
                  create: { slug: parsedUrl.pathname },
                },
              },
            },
          },
        },

        // User Agent relationship (deduplicated)
        ua: {
          connectOrCreate: {
            where: { ua: userAgent.ua },
            create: userAgent,
          },
        },

        // IP address (HASHED for privacy - GDPR compliant)
        // NOTE: Still using 'ip' field but storing hash
        // In Phase 2 we would rename this to 'ipHash'
        ip: ipHash,

        // Geographic data relationships
        country: req.query.country
          ? {
              connectOrCreate: {
                where: { country: String(req.query.country) },
                create: { country: String(req.query.country) },
              },
            }
          : undefined,

        city: req.query.city
          ? {
              connectOrCreate: {
                where: { city: String(req.query.city) },
                create: { city: String(req.query.city) },
              },
            }
          : undefined,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    console.log('[Tracking] Pageview recorded:', pageview.id)

    return successResponse(
      res,
      {
        id: pageview.id,
        timestamp: pageview.createdAt.toISOString(),
      },
      201
    )
  } catch (error) {
    console.error('[Tracking] Database error:', error)
    throw error
  }
}

/**
 * POST handler with rate limiting applied
 */
async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  if (trackingRateLimiter) {
    const rateLimitMiddleware = withRateLimit(trackingRateLimiter)
    await rateLimitMiddleware(req, res, async () => {
      await postHandlerBase(req, res)
    })
  } else {
    await postHandlerBase(req, res)
  }
}

/**
 * Export API handler with method routing
 */
export default createApiHandler({
  POST: postHandler,
})
