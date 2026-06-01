/**
 * scripts/init-motherduck.ts
 *
 * Initialize MotherDuck/DuckDB table schema and optionally sync all
 * pageview data from Postgres (Neon) into MotherDuck.
 *
 * Usage:
 *   npx tsx scripts/init-motherduck.ts          # Init table only
 *   npx tsx scripts/init-motherduck.ts --sync   # Init + full sync from Postgres
 *   npx tsx scripts/init-motherduck.ts --sync --batch 1000
 */

import { loadEnvConfig } from '@next/env';
import prisma from '../lib/prisma';

loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const SYNC = args.includes('--sync');
const BATCH_SIZE = (() => {
  const idx = args.indexOf('--batch');
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : 500;
})();

const MOTHERDUCK_TOKEN = process.env.MOTHERDUCK_TOKEN;
const DATABASE_NAME = process.env.MOTHERDUCK_DATABASE || 'my_db';
const TABLE_NAME = process.env.MOTHERDUCK_TABLE || 'pageviews';

if (!MOTHERDUCK_TOKEN) {
  console.error('\n❌ ERROR: MOTHERDUCK_TOKEN is not set in .env.local\n');
  process.exit(1);
}

// MotherDuck HTTP API endpoint
const MD_ENDPOINT = `https://app.motherduck.com/execute`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mdQuery(sql: string): Promise<any> {
  const res = await fetch(MD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MOTHERDUCK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `MotherDuck query failed (${res.status}): ${text.substring(0, 500)}`,
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// DDL
// ---------------------------------------------------------------------------

const DDL = `
CREATE TABLE IF NOT EXISTS ${DATABASE_NAME}.${TABLE_NAME} (
    id VARCHAR,
    sessionId VARCHAR,
    url VARCHAR,
    host VARCHAR,
    path VARCHAR,
    title VARCHAR,
    referrer VARCHAR,
    timestamp TIMESTAMP,
    ua VARCHAR,
    browser VARCHAR,
    browserVersion VARCHAR,
    os VARCHAR,
    osVersion VARCHAR,
    engine VARCHAR,
    engineVersion VARCHAR,
    device VARCHAR,
    deviceModel VARCHAR,
    deviceType VARCHAR,
    isBot BOOLEAN,
    botType VARCHAR,
    botName VARCHAR,
    ip VARCHAR,
    country VARCHAR,
    city VARCHAR,
    region VARCHAR,
    latitude DOUBLE,
    longitude DOUBLE,
    screenWidth INTEGER,
    screenHeight INTEGER,
    language VARCHAR,
    utmSource VARCHAR,
    utmMedium VARCHAR,
    utmCampaign VARCHAR,
    utmTerm VARCHAR,
    utmContent VARCHAR
)
`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function initTable() {
  console.log(
    `\n📦 Initializing MotherDuck table "${DATABASE_NAME}.${TABLE_NAME}"...`,
  );
  await mdQuery(DDL);
  console.log(`✅ Table "${DATABASE_NAME}.${TABLE_NAME}" is ready.`);
}

async function getTotalCount(): Promise<number> {
  return prisma.pageView.count();
}

async function syncBatch(offset: number, limit: number): Promise<number> {
  const rows = await prisma.pageView.findMany({
    skip: offset,
    take: limit,
    orderBy: { id: 'asc' },
    include: {
      url: { include: { host: true, slug: true } },
      ua: true,
      country: true,
      city: true,
    },
  });

  if (rows.length === 0) return 0;

  // Build VALUES for a single INSERT statement (batch insert)
  const escapeValue = (v: any): string => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (v instanceof Date)
      return `'${v.toISOString().replace('T', ' ').replace('Z', '')}'`;
    // Escape single quotes in strings
    return `'${String(v).replace(/'/g, "''")}'`;
  };

  const valueRows = rows.map((pv) => {
    const ua = pv.ua;
    const host = pv.url?.host?.host ?? '';
    const path = pv.url?.slug?.slug ?? '';
    const url = pv.url?.url ?? '';
    const country = pv.country?.country ?? null;
    const city = pv.city?.city ?? null;

    return `(${[
      escapeValue(`mig-${pv.id}`), // id
      escapeValue(pv.sessionId), // sessionId
      escapeValue(url), // url
      escapeValue(host), // host
      escapeValue(path), // path
      escapeValue(pv.title), // title
      escapeValue(pv.referrer), // referrer
      escapeValue(pv.createdAt), // timestamp
      escapeValue(ua?.ua ?? null), // ua
      escapeValue(ua?.browser ?? null), // browser
      escapeValue(ua?.browserVersion ?? null), // browserVersion
      escapeValue(ua?.os ?? null), // os
      escapeValue(ua?.osVersion ?? null), // osVersion
      escapeValue(ua?.engine ?? null), // engine
      escapeValue(ua?.engineVersion ?? null), // engineVersion
      escapeValue(ua?.device ?? null), // device
      escapeValue(ua?.deviceModel ?? null), // deviceModel
      escapeValue(ua?.deviceType ?? null), // deviceType
      escapeValue(ua?.isBot ?? false), // isBot
      escapeValue(ua?.botType ?? null), // botType
      escapeValue(ua?.botName ?? null), // botName
      escapeValue(pv.ip), // ip
      escapeValue(country), // country
      escapeValue(city), // city
      escapeValue(pv.region), // region
      escapeValue(pv.latitude), // latitude
      escapeValue(pv.longitude), // longitude
      escapeValue(pv.screenWidth), // screenWidth
      escapeValue(pv.screenHeight), // screenHeight
      escapeValue(pv.language), // language
      escapeValue(pv.utmSource), // utmSource
      escapeValue(pv.utmMedium), // utmMedium
      escapeValue(pv.utmCampaign), // utmCampaign
      escapeValue(pv.utmTerm), // utmTerm
      escapeValue(pv.utmContent), // utmContent
    ].join(', ')})`;
  });

  const insertSql = `
    INSERT INTO ${DATABASE_NAME}.${TABLE_NAME} VALUES
    ${valueRows.join(',\n')}
  `;

  await mdQuery(insertSql);
  return rows.length;
}

async function run() {
  console.log('\n🦆 MotherDuck Init & Sync Script');
  console.log(`   Database : ${DATABASE_NAME}`);
  console.log(`   Table    : ${TABLE_NAME}`);
  console.log(
    `   Sync     : ${SYNC ? `yes (batch=${BATCH_SIZE})` : 'no (init only)'}`,
  );

  try {
    await initTable();

    if (!SYNC) {
      console.log(
        '\n✅ Done. Run with --sync to also migrate data from Postgres.\n',
      );
      return;
    }

    console.log('\n📡 Connecting to Postgres to count records...');
    const total = await getTotalCount();
    console.log(`   Total Postgres records: ${total.toLocaleString()}`);

    if (total === 0) {
      console.log('   Nothing to migrate.\n');
      return;
    }

    let offset = 0;
    let migrated = 0;
    let errors = 0;
    const startTime = Date.now();

    console.log(`\n🚀 Starting migration in batches of ${BATCH_SIZE}...\n`);

    while (offset < total) {
      try {
        const count = await syncBatch(offset, BATCH_SIZE);
        migrated += count;
        offset += BATCH_SIZE;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const pct = Math.min(100, Math.round((migrated / total) * 100));
        const rate = Math.round(migrated / parseFloat(elapsed));
        process.stdout.write(
          `\r   Progress: ${migrated.toLocaleString()}/${total.toLocaleString()} (${pct}%) — ${rate} rows/s — ${elapsed}s elapsed   `,
        );

        if (count < BATCH_SIZE) break;
      } catch (err: any) {
        errors++;
        console.error(
          `\n   ⚠️  Batch at offset ${offset} failed: ${err.message}`,
        );
        offset += BATCH_SIZE; // Skip failed batch and continue
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n🎉 Migration complete!`);
    console.log(`   Migrated : ${migrated.toLocaleString()} rows`);
    console.log(`   Errors   : ${errors} batches skipped`);
    console.log(`   Time     : ${elapsed}s`);
    console.log(`   Table    : ${DATABASE_NAME}.${TABLE_NAME}\n`);
  } catch (err: any) {
    console.error('\n❌ FATAL ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
