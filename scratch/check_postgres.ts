import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function run() {
  console.log('Querying Postgres for pageviews to https://duni.vn...');
  try {
    const pvs = await prisma.pageView.findMany({
      where: {
        url: {
          url: {
            contains: 'duni.vn',
          },
        },
      },
      include: {
        url: true,
        ua: true,
        country: true,
        city: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${pvs.length} records.`);
    for (const pv of pvs) {
      console.log(
        `id: ${pv.id}, url: ${pv.url.url}, createdAt: ${pv.createdAt.toISOString()}, country: ${pv.country?.country}, city: ${pv.city?.city}, ua: ${pv.ua?.ua}`,
      );
    }
  } catch (err: any) {
    console.error('Error querying Postgres:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
