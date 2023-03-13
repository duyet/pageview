import { NextRequest, NextResponse, userAgent } from 'next/server'

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

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/api/:path*',
}
