import { NextRequest, NextResponse, userAgent } from 'next/server'

import { genScript } from './pageview'
import { classifyBot } from './lib/botDetection'

/**
 * Vercel extends NextRequest with geo/ip at runtime.
 * These aren't in the base NextRequest type in Next.js 16.
 */
interface VercelRequest extends NextRequest {
  geo?: {
    country?: string
    city?: string
    region?: string
    latitude?: string
    longitude?: string
  }
  ip?: string
}

export async function proxy(req: NextRequest) {
  const vercelReq = req as VercelRequest
  const { nextUrl: url } = vercelReq
  const { geo, ip } = vercelReq

  if (url.pathname.startsWith('/pageview.js')) {
    const content = genScript(`${url.protocol}//${url.host}/api/pageview`)

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/javascript',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  }

  // Geo
  url.searchParams.set('ip', ip || '')
  url.searchParams.set('country', geo?.country || '')
  url.searchParams.set('city', geo?.city || '')
  url.searchParams.set('region', geo?.region || '')
  url.searchParams.set('latitude', geo?.latitude || '')
  url.searchParams.set('longitude', geo?.longitude || '')

  // UA
  const parsedUA = userAgent(req)
  url.searchParams.set('ua', parsedUA.ua)
  url.searchParams.set('browser', parsedUA.browser.name || '')
  url.searchParams.set('browserVersion', parsedUA.browser.version || '')
  url.searchParams.set('os', parsedUA.os.name || '')
  url.searchParams.set('osVersion', parsedUA.os.version || '')
  url.searchParams.set('engine', parsedUA.engine.name || '')
  url.searchParams.set('engineVersion', parsedUA.engine.version || '')
  url.searchParams.set('device', parsedUA.device.vendor || '')
  url.searchParams.set('deviceModel', parsedUA.device.model || '')
  url.searchParams.set('deviceType', parsedUA.device.type || '')

  // Enhanced bot detection
  const botClassification = classifyBot(parsedUA.ua)
  url.searchParams.set('isBot', botClassification.isBot.toString())
  url.searchParams.set('botType', botClassification.botType || '')
  url.searchParams.set('botName', botClassification.botName || '')

  if (url.pathname.startsWith('/api')) {
    return NextResponse.rewrite(url)
  }
}

export const config = {
  matcher: ['/pageview.js', '/api/:path*'],
}
