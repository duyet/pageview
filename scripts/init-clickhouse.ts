import { loadEnvConfig } from '@next/env';

// Load environment variables automatically using Next.js native loader
loadEnvConfig(process.cwd());

// Resolve targeted ClickHouse URL: Command parameter > CLICKHOUSE_ADMIN_URL > CLICKHOUSE_URL
const targetUrlString =
  process.argv[2] ||
  process.env.CLICKHOUSE_ADMIN_URL ||
  process.env.CLICKHOUSE_URL ||
  '';

if (!targetUrlString) {
  console.error('\n❌ ERROR: No ClickHouse connection URL found.');
  console.error(
    'Please set CLICKHOUSE_URL or CLICKHOUSE_ADMIN_URL in .env.local, or pass the URL as an argument:',
  );
  console.error(
    '  npx tsx scripts/init-clickhouse.ts "https://admin:password@host:8123/database"\n',
  );
  process.exit(1);
}

// Target database schema definitions for diff analysis
const targetSchema: Record<string, string> = {
  id: 'String',
  sessionId: 'Nullable(String)',
  url: 'String',
  host: 'LowCardinality(String)',
  path: 'String',
  title: 'Nullable(String)',
  referrer: 'Nullable(String)',
  timestamp: 'DateTime64(3)',
  ua: 'Nullable(String)',
  browser: 'LowCardinality(Nullable(String))',
  browserVersion: 'LowCardinality(Nullable(String))',
  os: 'LowCardinality(Nullable(String))',
  osVersion: 'LowCardinality(Nullable(String))',
  engine: 'LowCardinality(Nullable(String))',
  engineVersion: 'LowCardinality(Nullable(String))',
  device: 'LowCardinality(Nullable(String))',
  deviceModel: 'Nullable(String)',
  deviceType: 'LowCardinality(Nullable(String))',
  isBot: 'UInt8',
  botType: 'LowCardinality(Nullable(String))',
  botName: 'LowCardinality(Nullable(String))',
  ip: 'Nullable(String)',
  country: 'LowCardinality(Nullable(String))',
  city: 'LowCardinality(Nullable(String))',
  region: 'LowCardinality(Nullable(String))',
  latitude: 'Nullable(Float64)',
  longitude: 'Nullable(Float64)',
  screenWidth: 'Nullable(Int32)',
  screenHeight: 'Nullable(Int32)',
  language: 'LowCardinality(Nullable(String))',
  utmSource: 'LowCardinality(Nullable(String))',
  utmMedium: 'LowCardinality(Nullable(String))',
  utmCampaign: 'LowCardinality(Nullable(String))',
  utmTerm: 'LowCardinality(Nullable(String))',
  utmContent: 'LowCardinality(Nullable(String))',
};

async function run() {
  console.log(
    '\n🚀 Starting ClickHouse Database/Table auto-initialization & migration...',
  );

  let parsed: URL;
  try {
    parsed = new URL(targetUrlString!);
  } catch (_err) {
    console.error('❌ ERROR: Invalid ClickHouse URL format:', targetUrlString);
    process.exit(1);
  }

  const pathDb = parsed.pathname.replace(/^\//, '');
  const database = parsed.searchParams.get('database') || pathDb || 'default';
  const table = parsed.searchParams.get('table') || 'pageviews';

  // Construct target HTTP base endpoint URL
  const targetUrl = new URL(parsed.origin);
  targetUrl.pathname = '/';

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain',
  };

  // Base64 encode credentials if present
  if (parsed.username || parsed.password) {
    const credentials = Buffer.from(
      `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`,
    ).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
  }

  console.log(`📡 Connecting to server: ${parsed.origin}`);
  console.log(`📁 Database: "${database}"`);
  console.log(`📊 Table: "${table}"`);

  try {
    // 1. Create Database if not default
    if (database !== 'default') {
      console.log(`\n1. Verifying database "${database}"...`);
      const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${database}`;

      const dbRes = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: createDbQuery,
      });

      if (!dbRes.ok) {
        const dbErr = await dbRes.text();
        throw new Error(`Database creation failed: ${dbErr.trim()}`);
      }
      console.log(`✅ Database "${database}" verified/created.`);
    }

    // 2. Check if table already exists
    console.log(`\n2. Checking if table "${database}.${table}" exists...`);
    const existsRes = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers,
      body: `EXISTS TABLE ${database}.${table}`,
    });

    if (!existsRes.ok) {
      const errText = await existsRes.text();
      throw new Error(`Failed to check table existence: ${errText.trim()}`);
    }

    const existsVal = (await existsRes.text()).trim();
    const tableExists = existsVal === '1';

    if (!tableExists) {
      // 3a. Table does not exist -> Run CREATE TABLE
      console.log(
        `👉 Table "${database}.${table}" does not exist. Initializing fresh table...`,
      );

      const ddlColumns = Object.entries(targetSchema)
        .map(([name, type]) => `          ${name} ${type}`)
        .join(',\n');

      const ddl = `
        CREATE TABLE ${database}.${table} (
${ddlColumns}
        ) ENGINE = MergeTree()
        ORDER BY (host, timestamp, id)
      `;

      const tableRes = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: ddl,
      });

      if (!tableRes.ok) {
        const tableErr = await tableRes.text();
        throw new Error(`Table creation failed: ${tableErr.trim()}`);
      }

      console.log(
        `✅ Table "${database}.${table}" successfully created with optimized schema!`,
      );
    } else {
      // 3b. Table exists -> Run schema migration/diff analysis
      console.log(
        `👉 Table "${database}.${table}" already exists. Running schema migration analysis...`,
      );

      // Query current columns and types from system table
      const columnsRes = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: `SELECT name, type FROM system.columns WHERE database = '${database}' AND table = '${table}' FORMAT JSON`,
      });

      if (!columnsRes.ok) {
        const colErr = await columnsRes.text();
        throw new Error(
          `Failed to read existing table columns: ${colErr.trim()}`,
        );
      }

      const columnsData = await columnsRes.json();
      const existingColumns = columnsData.data as Array<{
        name: string;
        type: string;
      }>;
      const existingSchemaMap = new Map(
        existingColumns.map((col) => [col.name, col.type]),
      );

      console.log(
        `   Found ${existingColumns.length} existing columns. Comparing with target schema...`,
      );

      let migrationsRun = 0;

      for (const [colName, targetType] of Object.entries(targetSchema)) {
        const existingType = existingSchemaMap.get(colName);

        if (!existingType) {
          // Column is missing entirely -> Run ADD COLUMN
          console.log(
            `⚙️  [Migration] Column "${colName}" is missing. Adding it...`,
          );
          const addQuery = `ALTER TABLE ${database}.${table} ADD COLUMN ${colName} ${targetType}`;

          const alterRes = await fetch(targetUrl.toString(), {
            method: 'POST',
            headers,
            body: addQuery,
          });

          if (!alterRes.ok) {
            const alterErr = await alterRes.text();
            throw new Error(
              `Failed to add column "${colName}": ${alterErr.trim()}`,
            );
          }
          console.log(`   ✅ Added column "${colName}" (${targetType})`);
          migrationsRun++;
        } else {
          // Normalise types for exact comparison: ClickHouse might return Nullable(String) or LowCardinality(String)
          // Clean spaces or syntax to compare logically
          const normExisting = existingType.replace(/\s+/g, '');
          const normTarget = targetType.replace(/\s+/g, '');

          if (normExisting !== normTarget) {
            // Column type mismatches -> Run MODIFY COLUMN to optimize/migrate (e.g. String -> LowCardinality)
            console.log(
              `⚙️  [Migration] Optimizing column "${colName}": migrating type "${existingType}" ➡️ "${targetType}"...`,
            );
            const modifyQuery = `ALTER TABLE ${database}.${table} MODIFY COLUMN ${colName} ${targetType}`;

            const alterRes = await fetch(targetUrl.toString(), {
              method: 'POST',
              headers,
              body: modifyQuery,
            });

            if (!alterRes.ok) {
              const alterErr = await alterRes.text();
              throw new Error(
                `Failed to optimize column "${colName}": ${alterErr.trim()}`,
              );
            }
            console.log(
              `   ✅ Optimized column "${colName}" type to "${targetType}"`,
            );
            migrationsRun++;
          }
        }
      }

      if (migrationsRun === 0) {
        console.log(
          `✅ Table schema is already up-to-date and fully optimized. No migrations needed!`,
        );
      } else {
        console.log(
          `✅ Successfully executed ${migrationsRun} migrations online. Table schema is fully optimized!`,
        );
      }
    }

    console.log('\n🎉 ClickHouse configuration is 100% complete and ready!\n');
  } catch (err: any) {
    console.error(
      `\n❌ SCHEMA INITIALIZATION & MIGRATION FAILED:`,
      err.message,
    );
    console.error(
      'Please verify that the URL is correct and the account has DDL/admin permissions.\n',
    );
    process.exit(1);
  }
}

run();
