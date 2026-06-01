import type { NextApiRequest, NextApiResponse } from 'next'
import normalizeUrl from 'normalize-url'
import crypto from 'crypto'

import { broadcastPageView } from '../../lib/adapters'
import { PageViewEvent } from '../../lib/adapters/types'

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

export const getUrl = (req: NextApiRequest): string | null => {
  // Get the URL from the request body, if it exists.
  if (req.body && req.body.url) {
    console.log('Detected url in body', req.body.url)
    return req.body.url
  }

  // Get the URL from the request parameters, if it exists.
  if (req.query.url) {
    console.log('Detected url in query', req.query.url)

    if (Array.isArray(req.query.url)) {
      return req.query.url[0]
    }

    return req.query.url
  }

  // Get the URL from the Referer header, if it exists.
  if (req.headers.referer) {
    console.log('Detected url in referer', req.headers.referer)
    return req.headers.referer
  }

  return null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const url = getUrl(req)

  if (url === null) {
    return res.status(400).json({ msg: 'URL is required' })
  }

  let normalizedUrl: string
  let parsedUrl: URL

  try {
    normalizedUrl = normalizeUrl(url as string, {
      removeQueryParameters: [/^utm_\w+/i, 'fbclid', 'ref', 'ref_src'],
    })
    parsedUrl = new URL(normalizedUrl)
  } catch (err) {
    return res.status(400).json({ msg: 'Invalid URL' })
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Normalized URL: ${normalizedUrl}`, parsedUrl)
  }

  // Check if custom data is provided in request body
  const customData: CustomPageviewData | undefined = req.body
  const hasCustomData =
    customData &&
    (customData.ua ||
      customData.country ||
      customData.city ||
      customData.browser)

  // Use custom data if provided, otherwise fall back to middleware-enriched data
  const uaString = hasCustomData
    ? customData.ua || req.headers['user-agent'] || ''
    : String(req.query.ua || '').trim() !== ''
      ? String(req.query.ua)
      : req.headers['user-agent'] || 'Unknown'

  // Convert empty string to null for proper database handling
  const ip = hasCustomData
    ? customData.ip || null
    : req.query.ip && String(req.query.ip).trim() !== ''
      ? String(req.query.ip)
      : req.socket?.remoteAddress || null

  const countryName = hasCustomData
    ? customData.country || 'Unknown'
    : String(req.query.country || '').trim() !== ''
      ? String(req.query.country)
      : 'Unknown'

  const cityName = hasCustomData
    ? customData.city || 'Unknown'
    : String(req.query.city || '').trim() !== ''
      ? String(req.query.city)
      : 'Unknown'

  // Skip empty or invalid entries (only for non-custom data)
  if (!hasCustomData && (!uaString || countryName === '' || cityName === '')) {
    return res.status(400).json({ msg: 'Missing required fields' })
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
        botType:
          req.query.botType && String(req.query.botType).trim() !== ''
            ? String(req.query.botType)
            : null,
        botName:
          req.query.botName && String(req.query.botName).trim() !== ''
            ? String(req.query.botName)
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
      : req.body?.title || req.query.title || null
  ) as string | null
  const referrer = (
    hasCustomData
      ? customData.referrer
      : req.body?.ref ||
        req.query.ref ||
        req.body?.referrer ||
        req.query.referrer ||
        req.headers.referer ||
        null
  ) as string | null

  const screenWidthVal = hasCustomData
    ? customData.screenWidth
    : req.body?.sw || req.query.sw
  const screenWidth = screenWidthVal
    ? parseInt(String(screenWidthVal), 10)
    : null

  const screenHeightVal = hasCustomData
    ? customData.screenHeight
    : req.body?.sh || req.query.sh
  const screenHeight = screenHeightVal
    ? parseInt(String(screenHeightVal), 10)
    : null

  const language = (
    hasCustomData
      ? customData.language
      : req.body?.lang || req.query.lang || null
  ) as string | null
  const sessionId = (
    hasCustomData
      ? customData.sessionId
      : req.body?.sid || req.query.sid || null
  ) as string | null
  const region = (
    hasCustomData
      ? customData.region
      : req.body?.region || req.query.region || null
  ) as string | null

  const latitudeVal = hasCustomData
    ? customData.latitude
    : req.body?.latitude || req.query.latitude
  const latitude = latitudeVal ? parseFloat(String(latitudeVal)) : null

  const longitudeVal = hasCustomData
    ? customData.longitude
    : req.body?.longitude || req.query.longitude
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

    // Broadcast pageview event concurrently to all active storage and HTTP streaming backends
    await broadcastPageView(pageviewEvent)

    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Record processed and broadcasted successfully',
        pageviewEvent
      )
    }

    return res.json({ msg: 'Pageview recorded successfully', id: eventId })
  } catch (err) {
    console.error('Error processing/broadcasting pageview:', err)
    return res.status(500).json({ msg: 'Something went wrong' })
  }
}
