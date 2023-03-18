import { NextRequest, NextResponse, userAgent } from 'next/server'

import { genScript } from './pageview'

export async function middleware(req: NextRequest) {
  const { nextUrl: url, geo, ip } = req

  // Geo
  url.searchParams.set('ip', ip || '')
  url.searchParams.set('country', geo?.country || '')
  url.searchParams.set('city', geo?.city || '')

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
  url.searchParams.set('isBot', parsedUA.isBot.toString())

  if (url.pathname.startsWith('/pageview.js')) {
    // Get content from public/pageview.js
    const content = genScript(`${url.protocol}//${url.host}/api/pageview`)

    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/javascript' },
    })
  }

  if (url.pathname.startsWith('/api')) {
    return NextResponse.rewrite(url)
  }
}

export const config = {
  matcher: ['/pageview.js', '/api/:path*'],
}
