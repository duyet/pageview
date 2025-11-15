import type { NextApiRequest, NextApiResponse } from 'next'
import normalizeUrl from 'normalize-url'

import prisma from '../../lib/prisma'

type Data = {
  msg: string
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

  // Parse and validate data from middleware
  const uaString = String(req.query.ua || '')
  const ip = req.query.ip ? String(req.query.ip) : null
  const countryName = String(req.query.country || '')
  const cityName = String(req.query.city || '')

  // Skip empty or invalid entries
  if (!uaString || !countryName || !cityName) {
    return res.status(400).json({ msg: 'Missing required fields' })
  }

  const parsedUAFromMiddleware = {
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

    return res.json({ msg: 'URL created' })
  } catch (err) {
    console.error('Error creating pageview:', err)
    return res.status(500).json({ msg: 'Something went wrong' })
  }
}
