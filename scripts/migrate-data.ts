import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { ClickHouseAdapter } from '../lib/adapters/clickhouse';
import { MotherDuckAdapter } from '../lib/adapters/motherduck';
import type { PageViewEvent } from '../lib/adapters/types';
import prisma from '../lib/prisma';

// Load environment variables automatically using Next.js native loader
loadEnvConfig(process.cwd());

const target = (process.argv[2] || '').trim().toLowerCase();

if (target !== 'clickhouse' && target !== 'duckdb') {
  console.error('\n❌ ERROR: Please specify a valid target storage.');
  console.error('Usage:');
  console.error('  npx tsx scripts/migrate-data.ts clickhouse');
  console.error('  npx tsx scripts/migrate-data.ts duckdb\n');
  process.exit(1);
}

function mapToEvent(pv: any): PageViewEvent {
  return {
    id: `mig-${pv.id}`,
    sessionId: pv.sessionId,
    url: pv.url.url,
    host: pv.url.host.host,
    path: pv.url.slug.slug,
    title: pv.title,
    referrer: pv.referrer,
    timestamp: pv.createdAt,

    ua: pv.ua?.ua || null,
    browser: pv.ua?.browser || null,
    browserVersion: pv.ua?.browserVersion || null,
    os: pv.ua?.os || null,
    osVersion: pv.ua?.osVersion || null,
    engine: pv.ua?.engine || null,
    engineVersion: pv.ua?.engineVersion || null,
    device: pv.ua?.device || null,
    deviceModel: pv.ua?.deviceModel || null,
    deviceType: pv.ua?.deviceType || null,
    isBot: pv.ua?.isBot || false,
    botType: pv.ua?.botType || null,
    botName: pv.ua?.botName || null,

    ip: pv.ip,
    country: pv.country?.country || null,
    city: pv.city?.city || null,
    region: pv.region,
    latitude: pv.latitude,
    longitude: pv.longitude,

    screenWidth: pv.screenWidth,
    screenHeight: pv.screenHeight,
    language: pv.language,

    utmSource: pv.utmSource,
    utmMedium: pv.utmMedium,
    utmCampaign: pv.utmCampaign,
    utmTerm: pv.utmTerm,
    utmContent: pv.utmContent,
  };
}

async function run() {
  console.log(
    `\n🚀 Starting OPTIMIZED batch data migration from PostgreSQL ➡️  ${target === 'clickhouse' ? 'ClickHouse' : 'MotherDuck/DuckDB'}...`,
  );

  // 1. Instantiate the target adapter
  const adapter =
    target === 'clickhouse' ? new ClickHouseAdapter() : new MotherDuckAdapter();

  if (!adapter.enabled) {
    console.error(`❌ ERROR: Target adapter "${adapter.name}" is not enabled.`);
    console.error(
      `Please configure the required environment variables in .env.local first.`,
    );
    process.exit(1);
  }

  // 2. Initialize the adapter (auto-provisions tables/databases)
  console.log(`⚙️  Initializing ${adapter.name} schema...`);
  await adapter.initialize();

  // 3. Migrate historical pageview records in large optimized batches
  const batchSize = 500;
  let skip = 0;
  let migratedCount = 0;
  let failedCount = 0;

  console.log('\n📥 Querying historical records from PostgreSQL...');

  while (true) {
    try {
      const pageviews = await prisma.pageView.findMany({
        skip,
        take: batchSize,
        orderBy: { createdAt: 'asc' },
        include: {
          url: {
            include: {
              host: true,
              slug: true,
            },
          },
          ua: true,
          country: true,
          city: true,
        },
      });

      if (pageviews.length === 0) {
        break;
      }

      console.log(
        `📦 Fetched batch of ${pageviews.length} records (skip: ${skip}). Bulk inserting...`,
      );

      // --- ClickHouse Bulk Insert ---
      if (target === 'clickhouse') {
        const records = pageviews.map((pv) => {
          const event = mapToEvent(pv);
          return {
            id: event.id,
            sessionId: event.sessionId || null,
            url: event.url,
            host: event.host,
            path: event.path,
            title: event.title || null,
            referrer: event.referrer || null,
            timestamp: event.timestamp
              .toISOString()
              .replace('T', ' ')
              .replace('Z', ''),
            ua: event.ua || null,
            browser: event.browser || null,
            browserVersion: event.browserVersion || null,
            os: event.os || null,
            osVersion: event.osVersion || null,
            engine: event.engine || null,
            engineVersion: event.engineVersion || null,
            device: event.device || null,
            deviceModel: event.deviceModel || null,
            deviceType: event.deviceType || null,
            isBot: event.isBot ? 1 : 0,
            botType: event.botType || null,
            botName: event.botName || null,
            ip: event.ip || null,
            country: event.country || null,
            city: event.city || null,
            region: event.region || null,
            latitude: event.latitude || null,
            longitude: event.longitude || null,
            screenWidth: event.screenWidth || null,
            screenHeight: event.screenHeight || null,
            language: event.language || null,
            utmSource: event.utmSource || null,
            utmMedium: event.utmMedium || null,
            utmCampaign: event.utmCampaign || null,
            utmTerm: event.utmTerm || null,
            utmContent: event.utmContent || null,
          };
        });

        // ClickHouse HTTP API parses newline-delimited JSON objects via FORMAT JSONEachRow
        const bodyContent = `${records.map((r) => JSON.stringify(r)).join('\n')}\n`;

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          const authHeader = (adapter as any).authHeader;
          if (authHeader) {
            headers.Authorization = authHeader;
          }

          const response = await fetch((adapter as any).endpoint, {
            method: 'POST',
            headers,
            body: bodyContent,
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP status ${response.status}: ${text}`);
          }

          migratedCount += records.length;
        } catch (err: any) {
          console.error(`   ❌ Failed to migrate batch:`, err.message);
          failedCount += records.length;
        }
      }

      // --- MotherDuck/DuckDB Bulk Insert ---
      else if (target === 'duckdb') {
        const isNative = (adapter as any).isNativeAvailable;
        if (!isNative) {
          // Optimized JSONL bulk file append (Fallback Mode)
          const records = pageviews.map((pv) => {
            const event = mapToEvent(pv);
            return {
              id: event.id,
              sessionId: event.sessionId || null,
              url: event.url,
              host: event.host,
              path: event.path,
              title: event.title || null,
              referrer: event.referrer || null,
              timestamp: event.timestamp.toISOString(),
              ua: event.ua || null,
              browser: event.browser || null,
              browserVersion: event.browserVersion || null,
              os: event.os || null,
              osVersion: event.osVersion || null,
              engine: event.engine || null,
              engineVersion: event.engineVersion || null,
              device: event.device || null,
              deviceModel: event.deviceModel || null,
              deviceType: event.deviceType || null,
              isBot: !!event.isBot,
              botType: event.botType || null,
              botName: event.botName || null,
              ip: event.ip || null,
              country: event.country || null,
              city: event.city || null,
              region: event.region || null,
              latitude: event.latitude || null,
              longitude: event.longitude || null,
              screenWidth: event.screenWidth || null,
              screenHeight: event.screenHeight || null,
              language: event.language || null,
              utmSource: event.utmSource || null,
              utmMedium: event.utmMedium || null,
              utmCampaign: event.utmCampaign || null,
              utmTerm: event.utmTerm || null,
              utmContent: event.utmContent || null,
            };
          });

          const bodyContent = `${records.map((r) => JSON.stringify(r)).join('\n')}\n`;
          const localBufferPath = (adapter as any).localBufferPath;

          try {
            await fs.promises.appendFile(localBufferPath, bodyContent, 'utf-8');
            migratedCount += records.length;
          } catch (err: any) {
            console.error(`   ❌ Failed to append batch:`, err.message);
            failedCount += records.length;
          }
        } else {
          // If native driver is present, broadcast individually
          const broadcastPromises = pageviews.map(async (pv) => {
            const event = mapToEvent(pv);
            try {
              await adapter.broadcast(event);
              migratedCount++;
            } catch (err: any) {
              console.error(
                `   ❌ Failed to migrate record ID ${pv.id}:`,
                err.message,
              );
              failedCount++;
            }
          });
          await Promise.all(broadcastPromises);
        }
      }

      skip += batchSize;
    } catch (err: any) {
      console.error('❌ Batch query or migration fatal error:', err.message);
      process.exit(1);
    }
  }

  console.log('\n🏁 MIGRATION COMPLETED!');
  console.log(`----------------------`);
  console.log(`✅ Successfully Migrated : ${migratedCount} records`);
  console.log(`❌ Failed Broadcasts    : ${failedCount} records`);
  console.log(`➡️  Target Storage      : ${adapter.name}\n`);
}

run();
