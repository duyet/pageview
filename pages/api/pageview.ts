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
      },
    })
    console.log('Record created', pageview)

    return res.json({ msg: 'ok' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ msg: 'Something went wrong' })
  }
}
