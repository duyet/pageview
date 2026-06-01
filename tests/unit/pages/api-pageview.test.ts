import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/pageview'
import * as adapterHub from '@/lib/adapters'

// Mock the Adapter Orchestrator
vi.mock('@/lib/adapters', () => {
  return {
    broadcastPageView: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Next.js API - /api/pageview Integration Handler', () => {
  const createMockResponse = () => {
    const res: Partial<NextApiResponse> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    }
    return res as NextApiResponse
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 bad request if URL is missing in request', async () => {
    const req = {
      body: {},
      query: {},
      headers: {},
    } as unknown as NextApiRequest
    const res = createMockResponse()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'URL is required' })
    )
  })

  it('should parse URL from request body, strip UTM params in normalization, but preserve them in UTM metrics', async () => {
    const req = {
      body: {
        url: 'https://mysite.com/landing?utm_source=adwords&utm_medium=cpc&utm_campaign=summer_deal&utm_content=button',
        title: 'Summer Deals',
        ref: 'https://news.ycombinator.com/',
        sw: 1440,
        sh: 900,
        lang: 'en-GB',
        sid: 'session-abcd-1234',
      },
      query: {
        ua: 'Mozilla/5.0 Chrome/124',
        country: 'Canada',
        city: 'Toronto',
        region: 'ON',
        latitude: '43.6532',
        longitude: '-79.3832',
      },
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/124',
      },
    } as unknown as NextApiRequest
    const res = createMockResponse()

    await handler(req, res)

    // Verify 200 OK success
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Pageview recorded successfully' })
    )

    // Verify broadcastPageView was called with the correctly structured and normalized PageViewEvent
    expect(adapterHub.broadcastPageView).toHaveBeenCalledTimes(1)
    const broadcastedEvent = vi.mocked(adapterHub.broadcastPageView).mock
      .calls[0][0]

    expect(broadcastedEvent.url).toBe('https://mysite.com/landing') // Normalized (UTM parameters removed)
    expect(broadcastedEvent.host).toBe('mysite.com')
    expect(broadcastedEvent.path).toBe('/landing')
    expect(broadcastedEvent.title).toBe('Summer Deals')
    expect(broadcastedEvent.referrer).toBe('https://news.ycombinator.com/')
    expect(broadcastedEvent.screenWidth).toBe(1440)
    expect(broadcastedEvent.screenHeight).toBe(900)
    expect(broadcastedEvent.language).toBe('en-GB')
    expect(broadcastedEvent.sessionId).toBe('session-abcd-1234')
    expect(broadcastedEvent.region).toBe('ON')
    expect(broadcastedEvent.latitude).toBe(43.6532)
    expect(broadcastedEvent.longitude).toBe(-79.3832)

    // Marketing UTM parameters must be successfully parsed and stored
    expect(broadcastedEvent.utmSource).toBe('adwords')
    expect(broadcastedEvent.utmMedium).toBe('cpc')
    expect(broadcastedEvent.utmCampaign).toBe('summer_deal')
    expect(broadcastedEvent.utmContent).toBe('button')
    expect(broadcastedEvent.utmTerm).toBeNull()
  })

  it('should fall back to query params or referer header if body is empty', async () => {
    const req = {
      body: {},
      query: {
        url: 'https://blog.mysite.com/post-1',
        title: 'Post Title',
        ua: 'Mozilla/5.0 Safari/605',
        country: 'United Kingdom',
        city: 'London',
      },
      headers: {
        referer: 'https://t.co/',
        'user-agent': 'Mozilla/5.0 Safari/605',
      },
    } as unknown as NextApiRequest
    const res = createMockResponse()

    await handler(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Pageview recorded successfully' })
    )

    const broadcastedEvent = vi.mocked(adapterHub.broadcastPageView).mock
      .calls[0][0]
    expect(broadcastedEvent.url).toBe('https://blog.mysite.com/post-1')
    expect(broadcastedEvent.host).toBe('blog.mysite.com')
    expect(broadcastedEvent.path).toBe('/post-1')
    expect(broadcastedEvent.title).toBe('Post Title')
    expect(broadcastedEvent.referrer).toBe('https://t.co/') // Inferred from referer header
  })
})
