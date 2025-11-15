import type { NextApiRequest, NextApiResponse } from 'next'
import normalizeUrl from 'normalize-url'

import prisma from '../../lib/prisma'

type Data = {
  msg: string
  id?: number
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
  country?: string
  city?: string
  ip?: string
}

export const getUrl = (req: NextApiRequest): string | null => {
  // Get the URL from the request body, if it exists.
  if (req.body.url) {
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
    : String(req.query.ua || '')

  // Convert empty string to null for proper database handling
  const ip = hasCustomData
    ? customData.ip || null
    : req.query.ip && String(req.query.ip).trim() !== ''
      ? String(req.query.ip)
      : null

  const countryName = hasCustomData
    ? customData.country || 'Unknown'
    : String(req.query.country || '')

  const cityName = hasCustomData
    ? customData.city || 'Unknown'
    : String(req.query.city || '')

  // Skip empty or invalid entries (only for non-custom data)
  if (!hasCustomData && (!uaString || !countryName || !cityName)) {
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
      }

  try {
    // Use a transaction to batch the lookups/creates for better performance
    const pageview = await prisma.$transaction(async (tx) => {
      // First, ensure all referenced entities exist
      // This reduces the number of round trips by doing lookups in parallel
      const [host, slug, ua, country, city] = await Promise.all([
        tx.host.upsert({
          where: { host: parsedUrl.hostname },
          update: {},
          create: { host: parsedUrl.hostname },
        }),
        tx.slug.upsert({
          where: { slug: parsedUrl.pathname },
          update: {},
          create: { slug: parsedUrl.pathname },
        }),
        tx.uA.upsert({
          where: { ua: uaString },
          update: {},
          create: parsedUAFromMiddleware,
        }),
        tx.country.upsert({
          where: { country: countryName },
          update: {},
          create: { country: countryName },
        }),
        tx.city.upsert({
          where: { city: cityName },
          update: {},
          create: { city: cityName },
        }),
      ])

      // Then upsert the URL
      const urlRecord = await tx.url.upsert({
        where: { url: normalizedUrl },
        update: {},
        create: {
          url: normalizedUrl,
          hostId: host.id,
          slugId: slug.id,
        },
      })

      // Finally create the pageview with all IDs
      return tx.pageView.create({
        data: {
          urlId: urlRecord.id,
          uAId: ua.id,
          ip,
          countryId: country.id,
          cityId: city.id,
        },
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('Record created', pageview)
    }

    return res.json({ msg: 'Pageview recorded successfully', id: pageview.id })
  } catch (err) {
    console.error('Error creating pageview:', err)
    return res.status(500).json({ msg: 'Something went wrong' })
  }
}
