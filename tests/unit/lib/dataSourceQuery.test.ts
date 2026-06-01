import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getTrendsData,
  getDevicesData,
  getLocationsData,
} from '@/lib/analytics/dataSourceQuery'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Mock prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    pageView: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    url: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    uA: {
      findMany: vi.fn(),
    },
    country: {
      findMany: vi.fn(),
    },
    city: {
      findMany: vi.fn(),
    },
  },
}))

describe('DataSource SQL Query Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PostgreSQL Route Delegation', () => {
    it('should query Postgres prisma pageView.groupBy for trends', async () => {
      // Mock prisma queries to return dummy array
      vi.mocked(prisma.pageView.groupBy)
        .mockResolvedValueOnce([
          { createdAt: new Date(), _count: { id: 10 } },
        ] as any) // dailyPageviews
        .mockResolvedValueOnce([
          { createdAt: new Date(), ip: '127.0.0.1' },
        ] as any) // uniqueIpsByDay
        .mockResolvedValueOnce([{ ip: '127.0.0.1' }] as any) // allUniqueIps

      const result = await getTrendsData('postgres', 1)

      expect(prisma.pageView.groupBy).toHaveBeenCalledTimes(3)
      expect(result).toHaveProperty('trends')
      expect(result).toHaveProperty('totalPageviews')
      expect(result.trends.length).toBe(1)
    })

    it('should query Postgres prisma for device data', async () => {
      vi.mocked(prisma.pageView.groupBy).mockResolvedValueOnce([
        { uAId: 1, _count: { id: 5 } },
      ] as any)
      vi.mocked(prisma.pageView.count).mockResolvedValueOnce(5)
      vi.mocked(prisma.uA.findMany).mockResolvedValueOnce([
        { id: 1, browser: 'Chrome', os: 'macOS', deviceType: 'desktop' },
      ] as any)

      const result = await getDevicesData('postgres', 7)

      expect(prisma.pageView.groupBy).toHaveBeenCalledTimes(1)
      expect(prisma.uA.findMany).toHaveBeenCalledTimes(1)
      expect(result.browsers[0].name).toBe('Chrome')
      expect(result.browsers[0].value).toBe(5)
    })
  })

  describe('DuckDB JSONL Fallback Route', () => {
    const bufferDir = path.join(process.cwd(), '.antigravitycli')
    const bufferFile = path.join(bufferDir, 'duckdb_buffer.jsonl')

    beforeEach(() => {
      // Create temporary .antigravitycli/duckdb_buffer.jsonl with sample events
      if (!fs.existsSync(bufferDir)) {
        fs.mkdirSync(bufferDir, { recursive: true })
      }

      const mockEvent1 = {
        id: '1',
        sessionId: 'sess1',
        url: 'https://mysite.com/home',
        host: 'mysite.com',
        path: '/home',
        timestamp: new Date().toISOString(),
        browser: 'Chrome',
        os: 'macOS',
        deviceType: 'desktop',
        country: 'US',
        city: 'San Francisco',
        ip: '8.8.8.8',
        isBot: false,
      }

      const mockEvent2 = {
        id: '2',
        sessionId: 'sess2',
        url: 'https://mysite.com/home',
        host: 'mysite.com',
        path: '/home',
        timestamp: new Date().toISOString(),
        browser: 'Safari',
        os: 'iOS',
        deviceType: 'mobile',
        country: 'VN',
        city: 'Hanoi',
        ip: '1.1.1.1',
        isBot: false,
      }

      fs.writeFileSync(
        bufferFile,
        JSON.stringify(mockEvent1) + '\n' + JSON.stringify(mockEvent2) + '\n'
      )
    })

    afterEach(() => {
      // Clean up temporary files
      try {
        if (fs.existsSync(bufferFile)) {
          fs.unlinkSync(bufferFile)
        }
      } catch (err) {
        // Ignore
      }
    })

    it('should aggregate data inside fallback JSONL buffer for trends', async () => {
      const result = await getTrendsData('duckdb', 1)
      expect(result.totalPageviews).toBe(2)
      expect(result.totalUniqueVisitors).toBe(2)
    })

    it('should aggregate browser/OS statistics from local JSONL buffer', async () => {
      const result = await getDevicesData('duckdb', 1)
      expect(result.total).toBe(2)
      expect(result.browsers.length).toBe(2)
      expect(result.browsers.find((b) => b.name === 'Chrome')?.value).toBe(1)
      expect(result.os.find((o) => o.name === 'macOS')?.value).toBe(1)
    })

    it('should aggregate country/city statistics from local JSONL buffer', async () => {
      const result = await getLocationsData('duckdb', 1)
      expect(result.total).toBe(2)
      expect(result.countries.find((c) => c.name === 'US')?.value).toBe(1)
      expect(result.cities.find((c) => c.name === 'Hanoi')?.value).toBe(1)
    })
  })
})
