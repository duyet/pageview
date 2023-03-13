import type { NextApiRequest, NextApiResponse } from 'next'

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

  const parsedUrl = new URL(url as string)
  console.log('url', parsedUrl)

  const parsedUAFromMiddleware = {
    ua: '' + req.query.ua,
    browser: '' + req.query.browser,
    browserVersion: '' + req.query.browserVersion,
    os: '' + req.query.os,
    osVersion: '' + req.query.osVersion,
    engine: '' + req.query.engine,
    engineVersion: '' + req.query.engineVersion,
    device: '' + req.query.device,
    deviceModel: '' + req.query.deviceModel,
    deviceType: '' + req.query.deviceType,
    isBot: req.query.isBot === 'true',
  }

  try {
    const pageview = await prisma.pageView.create({
      data: {
        url: {
          connectOrCreate: {
            where: { url },
            create: {
              url,
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
        ua: {
          connectOrCreate: {
            where: { ua: parsedUAFromMiddleware.ua },
            create: {
              ...parsedUAFromMiddleware,
            },
          },
        },
        ip: req.query.ip ? '' + req.query.ip : null,
        country: {
          connectOrCreate: {
            where: { country: '' + req.query.country },
            create: { country: '' + req.query.country },
          },
        },
        city: {
          connectOrCreate: {
            where: { city: '' + req.query.city },
            create: { city: '' + req.query.city },
          },
        },
      },
    })
    console.log('Record created', pageview)

    return res.json({ msg: 'ok' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ msg: 'Something went wrong' })
  }
}
