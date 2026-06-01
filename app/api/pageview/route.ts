import normalizeUrl from 'normalize-url'
import crypto from 'crypto'

import { broadcastPageView } from '@/lib/adapters'
import { PageViewEvent } from '@/lib/adapters/types'

type Data = {
  msg: string
  id?: string
}

// Custom pageview data format for direct API calls
type CustomPageviewData = {
  url: string
  ua?: string
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  engine?: string
  engineVersion?: string
  device?: string
  deviceModel?: string
  deviceType?: string
  isBot?: boolean
  botType?: string
  botName?: string
  country?: string
  city?: string
  ip?: string

  // Custom enrichment fields for API
  title?: string
  referrer?: string
  region?: string
  latitude?: number
  longitude?: number
  screenWidth?: number
  screenHeight?: number
  language?: string
  sessionId?: string
}

/**
 * Extract the target URL from query params, body, or Referer header.
 */
function extractUrl(
  searchParams: URLSearchParams,
  body: Record<string, unknown> | null,
  referer: string | null
): string | null {
  // Get the URL from the request body, if it exists.
  if (body && body.url) {
    console.log('Detected url in body', body.url)
    return body.url as string
  }

  // Get the URL from the request parameters, if it exists.
  const queryUrl = searchParams.get('url')
  if (queryUrl) {
    console.log('Detected url in query', queryUrl)
    return queryUrl
  }

  // Get the URL from the Referer header, if it exists.
  if (referer) {
    console.log('Detected url in referer', referer)
    return referer
  }

  return null
}

/**
 * Shared core logic for recording a pageview event.
 * Extracted so both GET and POST handlers can use it.
 */
async function processPageview(
  url: string,
  searchParams: URLSearchParams,
  body: Record<string, unknown> | null,
  headers: Headers
): Promise<Response> {
  let normalizedUrl: string
  let parsedUrl: URL

  try {
    normalizedUrl = normalizeUrl(url as string, {
      removeQueryParameters: [/^utm_\w+/i, 'fbclid', 'ref', 'ref_src'],
    })
    parsedUrl = new URL(normalizedUrl)
  } catch (err) {
    return Response.json({ msg: 'Invalid URL' } satisfies Data, { status: 400 })
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Normalized URL: ${normalizedUrl}`, parsedUrl)
  }

  // Check if custom data is provided in request body
  const customData = body as CustomPageviewData | undefined
  const hasCustomData =
    customData &&
    (customData.ua ||
      customData.country ||
      customData.city ||
      customData.browser)

  // Use custom data if provided, otherwise fall back to middleware-enriched data
  const uaString = hasCustomData
    ? customData.ua || headers.get('user-agent') || ''
    : String(searchParams.get('ua') || '').trim() !== ''
      ? String(searchParams.get('ua'))
      : headers.get('user-agent') || 'Unknown'

  // Convert empty string to null for proper database handling
  // Note: App Router does not expose req.socket.remoteAddress directly.
  // IP is expected to come from middleware-enriched query params or custom data.
  const ip = hasCustomData
    ? customData.ip || null
    : searchParams.get('ip') && String(searchParams.get('ip')).trim() !== ''
      ? String(searchParams.get('ip'))
      : null

  const countryName = hasCustomData
    ? customData.country || 'Unknown'
    : String(searchParams.get('country') || '').trim() !== ''
      ? String(searchParams.get('country'))
      : 'Unknown'

  const cityName = hasCustomData
    ? customData.city || 'Unknown'
    : String(searchParams.get('city') || '').trim() !== ''
      ? String(searchParams.get('city'))
      : 'Unknown'

  // Skip empty or invalid entries (only for non-custom data)
  if (!hasCustomData && (!uaString || countryName === '' || cityName === '')) {
    return Response.json({ msg: 'Missing required fields' } satisfies Data, {
      status: 400,
    })
  }

  const parsedUAFromMiddleware = hasCustomData
    ? {
        ua: uaString,
        browser: customData.browser || '',
        browserVersion: customData.browserVersion || '',
        os: customData.os || '',
        osVersion: customData.osVersion || '',
        engine: customData.engine || '',
        engineVersion: customData.engineVersion || '',
        device: customData.device || '',
        deviceModel: customData.deviceModel || '',
        deviceType: customData.deviceType || '',
        isBot: customData.isBot || false,
        botType: customData.botType || null,
        botName: customData.botName || null,
      }
    : {
        ua: uaString,
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
        botType:
          searchParams.get('botType') &&
          String(searchParams.get('botType')).trim() !== ''
            ? String(searchParams.get('botType'))
            : null,
        botName:
          searchParams.get('botName') &&
          String(searchParams.get('botName')).trim() !== ''
            ? String(searchParams.get('botName'))
            : null,
      }

  // Parse marketing UTM attributes from the raw target URL
  let utmSource: string | null = null
  let utmMedium: string | null = null
  let utmCampaign: string | null = null
  let utmTerm: string | null = null
  let utmContent: string | null = null

  try {
    const origUrl = new URL(url as string)
    utmSource = origUrl.searchParams.get('utm_source')
    utmMedium = origUrl.searchParams.get('utm_medium')
    utmCampaign = origUrl.searchParams.get('utm_campaign')
    utmTerm = origUrl.searchParams.get('utm_term')
    utmContent = origUrl.searchParams.get('utm_content')
  } catch (err) {
    // Ignore invalid original URLs
  }

  // Extract enrichment parameters from query or body
  const title = (
    hasCustomData
      ? customData.title
      : body?.title || searchParams.get('title') || null
  ) as string | null
  const referrer = (
    hasCustomData
      ? customData.referrer
      : body?.ref ||
        searchParams.get('ref') ||
        body?.referrer ||
        searchParams.get('referrer') ||
        headers.get('referer') ||
        null
  ) as string | null

  const screenWidthVal = hasCustomData
    ? customData.screenWidth
    : body?.sw || searchParams.get('sw')
  const screenWidth = screenWidthVal
    ? parseInt(String(screenWidthVal), 10)
    : null

  const screenHeightVal = hasCustomData
    ? customData.screenHeight
    : body?.sh || searchParams.get('sh')
  const screenHeight = screenHeightVal
    ? parseInt(String(screenHeightVal), 10)
    : null

  const language = (
    hasCustomData
      ? customData.language
      : body?.lang || searchParams.get('lang') || null
  ) as string | null
  const sessionId = (
    hasCustomData
      ? customData.sessionId
      : body?.sid || searchParams.get('sid') || null
  ) as string | null
  const region = (
    hasCustomData
      ? customData.region
      : body?.region || searchParams.get('region') || null
  ) as string | null

  const latitudeVal = hasCustomData
    ? customData.latitude
    : body?.latitude || searchParams.get('latitude')
  const latitude = latitudeVal ? parseFloat(String(latitudeVal)) : null

  const longitudeVal = hasCustomData
    ? customData.longitude
    : body?.longitude || searchParams.get('longitude')
  const longitude = longitudeVal ? parseFloat(String(longitudeVal)) : null

  try {
    const eventId = crypto.randomUUID()
    const pageviewEvent: PageViewEvent = {
      id: eventId,
      sessionId,
      url: normalizedUrl,
      host: parsedUrl.hostname,
      path: parsedUrl.pathname,
      title,
      referrer,
      timestamp: new Date(),

      ua: uaString,
      browser: parsedUAFromMiddleware.browser || null,
      browserVersion: parsedUAFromMiddleware.browserVersion || null,
      os: parsedUAFromMiddleware.os || null,
      osVersion: parsedUAFromMiddleware.osVersion || null,
      engine: parsedUAFromMiddleware.engine || null,
      engineVersion: parsedUAFromMiddleware.engineVersion || null,
      device: parsedUAFromMiddleware.device || null,
      deviceModel: parsedUAFromMiddleware.deviceModel || null,
      deviceType: parsedUAFromMiddleware.deviceType || null,
      isBot: parsedUAFromMiddleware.isBot || false,
      botType: parsedUAFromMiddleware.botType || null,
      botName: parsedUAFromMiddleware.botName || null,

      ip,
      country: countryName,
      city: cityName,
      region,
      latitude,
      longitude,

      screenWidth,
      screenHeight,
      language,

      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    }

    // Fire-and-forget: broadcast to all adapters in the background.
    // Analytics collection endpoints must respond fast — replication to
    // ClickHouse/DuckDB/Webhook happens asynchronously.
    broadcastPageView(pageviewEvent).catch((err) => {
      console.error('Background broadcast error:', err)
    })

    return Response.json(
      { msg: 'Pageview recorded successfully', id: eventId } satisfies Data
    )
  } catch (err) {
    console.error('Error processing/broadcasting pageview:', err)
    return Response.json({ msg: 'Something went wrong' } satisfies Data, {
      status: 500,
    })
  }
}

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const referer = request.headers.get('referer')

  let body: Record<string, unknown> | null = null
  try {
    body = await request.json()
  } catch {
    // Body is not JSON or empty — will rely on query params / headers
  }

  const url = extractUrl(searchParams, body, referer)

  if (url === null) {
    return Response.json({ msg: 'URL is required' } satisfies Data, {
      status: 400,
    })
  }

  return processPageview(url, searchParams, body, request.headers)
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const referer = request.headers.get('referer')

  const url = extractUrl(searchParams, null, referer)

  if (url === null) {
    return Response.json({ msg: 'URL is required' } satisfies Data, {
      status: 400,
    })
  }

  return processPageview(url, searchParams, null, request.headers)
}
