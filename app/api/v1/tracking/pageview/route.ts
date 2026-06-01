/**
 * POST /api/v1/tracking/pageview
 * Track a pageview with privacy-compliant IP hashing
 */

import normalizeUrl from 'normalize-url'
import {
  successResponse,
  badRequestResponse,
} from '@/lib/api/app-response'
import { hashIp, isBotUserAgent } from '@/lib/privacy/hash'
import prisma from '@/lib/prisma'

/**
 * Extract URL from request (body, query, or referer header)
 */
function extractUrl(
  body: Record<string, unknown> | null,
  searchParams: URLSearchParams,
  headers: Headers
): string | null {
  // Priority 1: Request body
  if (body?.url) {
    console.log('[Tracking] URL from body:', body.url)
    return body.url as string
  }

  // Priority 2: Query parameter
  const queryUrl = searchParams.get('url')
  if (queryUrl) {
    console.log('[Tracking] URL from query:', queryUrl)
    return queryUrl
  }

  // Priority 3: Referer header
  const referer = headers.get('referer')
  if (referer) {
    console.log('[Tracking] URL from referer:', referer)
    return referer
  }

  return null
}

/**
 * Parse user agent data from middleware query params
 */
function parseUserAgent(searchParams: URLSearchParams) {
  return {
    ua: String(searchParams.get('ua') || ''),
    browser: String(searchParams.get('browser') || ''),
    browserVersion: String(searchParams.get('browserVersion') || ''),
    os: String(searchParams.get('os') || ''),
    osVersion: String(searchParams.get('osVersion') || ''),
    engine: String(searchParams.get('engine') || ''),
    engineVersion: String(searchParams.get('engineVersion') || ''),
    device: String(searchParams.get('device') || ''),
    deviceModel: String(searchParams.get('deviceModel') || ''),
    deviceType: String(searchParams.get('deviceType') || ''),
    isBot: searchParams.get('isBot') === 'true',
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const headers = request.headers

  // Parse body (may be empty for beacon requests)
  let body: Record<string, unknown> | null = null
  try {
    body = await request.json()
  } catch {
    // Body may be empty
  }

  // Extract URL from request
  const url = extractUrl(body, searchParams, headers)

  if (!url) {
    return badRequestResponse(
      'URL is required (provide via body, query, or referer header)'
    )
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    return badRequestResponse('Invalid URL format')
  }

  // Check if bot (optional filtering)
  const userAgentString = String(
    searchParams.get('ua') || headers.get('user-agent') || ''
  )
  const isBot = isBotUserAgent(userAgentString)

  if (isBot) {
    console.log('[Tracking] Bot detected, skipping:', userAgentString)
    return successResponse(
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
  const userAgent = parseUserAgent(searchParams)

  // Hash IP address for privacy compliance (GDPR)
  const rawIp = searchParams.get('ip')
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
        ip: ipHash,

        // Geographic data relationships
        country: searchParams.get('country')
          ? {
              connectOrCreate: {
                where: { country: String(searchParams.get('country')) },
                create: { country: String(searchParams.get('country')) },
              },
            }
          : undefined,

        city: searchParams.get('city')
          ? {
              connectOrCreate: {
                where: { city: String(searchParams.get('city')) },
                create: { city: String(searchParams.get('city')) },
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
