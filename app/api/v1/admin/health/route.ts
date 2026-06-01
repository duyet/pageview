/**
 * GET /api/v1/admin/health
 * Health check endpoint
 */

import {
  serviceUnavailableResponse,
  successResponse,
} from '@/lib/api/app-response';
import prisma from '@/lib/prisma';
import type { HealthCheckResponse } from '@/types/api';

export async function GET() {
  const _startTime = Date.now();

  // Check database connection
  let databaseConnected = false;
  let databaseLatency: number | undefined;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatency = Date.now() - dbStart;
    databaseConnected = true;
  } catch (error) {
    console.error('[Health Check] Database error:', error);
  }

  // Calculate uptime
  const uptime = process.uptime();

  // Determine overall status
  const status: 'ok' | 'degraded' | 'down' = databaseConnected
    ? databaseLatency && databaseLatency > 1000
      ? 'degraded'
      : 'ok'
    : 'down';

  const healthData: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime,
    database: {
      connected: databaseConnected,
      latency: databaseLatency,
    },
  };

  if (status === 'down') {
    return serviceUnavailableResponse('Service is down');
  }

  return successResponse(healthData);
}
