import path from 'node:path';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log(
  'Postgres Database Host:',
  process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : 'None',
);
console.log(
  'Postgres Database Name:',
  process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).pathname
    : 'None',
);
console.log(
  'ClickHouse URL Host:',
  process.env.CLICKHOUSE_URL
    ? new URL(process.env.CLICKHOUSE_URL).host
    : 'None',
);
console.log(
  'ClickHouse URL Path:',
  process.env.CLICKHOUSE_URL
    ? new URL(process.env.CLICKHOUSE_URL).pathname
    : 'None',
);
