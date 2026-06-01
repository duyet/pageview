import crypto from 'node:crypto';
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { broadcastPageView, registeredAdapters } from '@/lib/adapters';
import { ClickHouseAdapter } from '@/lib/adapters/clickhouse';
import { MotherDuckAdapter } from '@/lib/adapters/motherduck';
import type { PageViewEvent } from '@/lib/adapters/types';
import { WebhookAdapter } from '@/lib/adapters/webhook';

// Mock PageView Event
const mockEvent: PageViewEvent = {
  id: 'test-event-uuid',
  sessionId: 'test-sess-123',
  url: 'https://example.com/hello?utm_source=news',
  host: 'example.com',
  path: '/hello',
  title: 'Hello World',
  referrer: 'https://google.com/',
  timestamp: new Date('2026-06-01T15:00:00Z'),
  ua: 'Mozilla/5.0 Chrome/124.0.0',
  browser: 'Chrome',
  browserVersion: '124.0.0',
  os: 'macOS',
  osVersion: '14.4.1',
  isBot: false,
  ip: '127.0.0.1',
  country: 'United States',
  city: 'Seattle',
  region: 'WA',
  screenWidth: 1920,
  screenHeight: 1080,
  language: 'en-US',
  utmSource: 'news',
};

describe('PageView Multi-Adapter Broadcast System', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Clear out env variables before each run
    delete process.env.CLICKHOUSE_URL;
    delete process.env.WEBHOOK_URL;
    delete process.env.WEBHOOK_SECRET;
    delete process.env.MOTHERDUCK_TOKEN;
    delete process.env.ENABLE_DUCKDB;
    delete process.env.ENABLE_POSTGRES;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('ClickHouse Adapter', () => {
    it('should parse CLICKHOUSE_URL correctly and register endpoint', () => {
      process.env.CLICKHOUSE_URL =
        'http://admin:secret@clickhouse.host:8123/analytics?table=custom_pageviews';

      const adapter = new ClickHouseAdapter();
      expect(adapter.enabled).toBe(true);

      // Accessing internal private properties via cast
      const privateAdapter = adapter as any;
      expect(privateAdapter.database).toBe('analytics');
      expect(privateAdapter.table).toBe('custom_pageviews');
      expect(privateAdapter.authHeader).toBe('Basic YWRtaW46c2VjcmV0'); // base64 admin:secret
      expect(privateAdapter.endpoint).toContain(
        'INSERT+INTO+analytics.custom_pageviews+FORMAT+JSONEachRow',
      );
    });

    it('should perform POST fetch request on broadcast', async () => {
      process.env.CLICKHOUSE_URL = 'http://localhost:8123/';
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('ok'),
        } as Response),
      );
      global.fetch = mockFetch;

      const adapter = new ClickHouseAdapter();
      await adapter.broadcast(mockEvent);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('POST');

      const parsedBody = JSON.parse(callArgs[1].body.trim());
      expect(parsedBody.id).toBe(mockEvent.id);
      expect(parsedBody.host).toBe(mockEvent.host);
      expect(parsedBody.title).toBe(mockEvent.title);
    });
  });

  describe('Webhook Adapter', () => {
    it('should POST JSON body to target URL and sign with HMAC SHA256 signature when secret is set', async () => {
      process.env.WEBHOOK_URL = 'https://mywebhook.receiver/events';
      process.env.WEBHOOK_SECRET = 'super-secret-key';

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('success'),
        } as Response),
      );
      global.fetch = mockFetch;

      const adapter = new WebhookAdapter();
      await adapter.broadcast(mockEvent);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [targetUrl, reqConfig] = mockFetch.mock.calls[0];
      expect(targetUrl).toBe('https://mywebhook.receiver/events');
      expect(reqConfig.method).toBe('POST');

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', 'super-secret-key')
        .update(JSON.stringify(mockEvent))
        .digest('hex');

      expect(reqConfig.headers['X-Webhook-Signature']).toBe(expectedSignature);
    });
  });

  describe('MotherDuck/DuckDB Adapter', () => {
    it('should fallback to local JSONL buffer mode when native duckdb package is absent', async () => {
      process.env.ENABLE_DUCKDB = 'true';

      // Mock write files
      const appendSpy = vi
        .spyOn(fs.promises, 'appendFile')
        .mockImplementation(() => Promise.resolve());

      const adapter = new MotherDuckAdapter();
      await adapter.initialize(); // Triggers initialization check

      await adapter.broadcast(mockEvent);
      expect(appendSpy).toHaveBeenCalledTimes(1);

      const [filePath, fileContent] = appendSpy.mock.calls[0];
      expect(filePath as string).toContain('duckdb_buffer.jsonl');

      const parsedRecord = JSON.parse((fileContent as string).trim());
      expect(parsedRecord.id).toBe(mockEvent.id);
      expect(parsedRecord.browser).toBe(mockEvent.browser);
      expect(parsedRecord.utmSource).toBe(mockEvent.utmSource);
    });
  });

  describe('Adapter Hub Orchestrator', () => {
    it('should aggregate enabled adapters and broadcast in parallel', async () => {
      // Mock adapters to prevent actual I/O during hub test
      const dummyAdapter1 = {
        name: 'Mock1',
        enabled: true,
        initialize: vi.fn().mockResolvedValue(undefined),
        broadcast: vi.fn().mockResolvedValue(undefined),
      };
      const dummyAdapter2 = {
        name: 'Mock2',
        enabled: true,
        initialize: vi.fn().mockResolvedValue(undefined),
        broadcast: vi.fn().mockRejectedValue(new Error('Broadcast failed')),
      };

      // Temporarily overwrite registeredAdapters
      const originalAdapters = [...registeredAdapters];
      registeredAdapters.length = 0;
      registeredAdapters.push(dummyAdapter1 as any, dummyAdapter2 as any);

      // Run broadcast
      const errorLogSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await broadcastPageView(mockEvent);

      expect(dummyAdapter1.broadcast).toHaveBeenCalledWith(mockEvent);
      expect(dummyAdapter2.broadcast).toHaveBeenCalledWith(mockEvent);
      expect(errorLogSpy).toHaveBeenCalled(); // verifies the failure from dummyAdapter2 is caught and logged but does not disrupt dummyAdapter1

      // Restore registeredAdapters
      registeredAdapters.length = 0;
      registeredAdapters.push(...originalAdapters);
    });
  });
});
