import { ClickHouseAdapter } from './clickhouse';
import { MotherDuckAdapter } from './motherduck';
import { PostgresAdapter } from './postgres';
import type { PageViewAdapter, PageViewEvent } from './types';
import { WebhookAdapter } from './webhook';

// Instantiate and filter only the enabled adapters based on configuration
export const registeredAdapters: PageViewAdapter[] = [
  new PostgresAdapter(),
  new ClickHouseAdapter(),
  new MotherDuckAdapter(),
  new WebhookAdapter(),
].filter((adapter) => adapter.enabled);

let isInitialized = false;

/**
 * Initializes all active/enabled database and webhook adapters.
 * Catch errors individually so one misconfigured adapter doesn't block the rest.
 */
export async function initializeAdapters(): Promise<void> {
  if (isInitialized) return;

  const initPromises = registeredAdapters.map(async (adapter) => {
    try {
      await adapter.initialize();
    } catch (err) {
      console.error(
        `[Adapter Hub] Failed to initialize adapter: "${adapter.name}"`,
        err,
      );
    }
  });

  await Promise.all(initPromises);
  isInitialized = true;
  console.log(
    `[Adapter Hub] Active adapters: ${registeredAdapters.map((a) => a.name).join(', ') || 'None'}`,
  );
}

/**
 * Broadcasts a pageview event to all enabled adapters concurrently.
 * Uses Promise.allSettled to guarantee that the failure of one adapter
 * (e.g., ClickHouse HTTP down or Webhook timeout) never fails or delays other adapters.
 */
export async function broadcastPageView(event: PageViewEvent): Promise<void> {
  // Ensure all adapters are initialized before broadcasting
  if (!isInitialized) {
    await initializeAdapters();
  }

  if (registeredAdapters.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Adapter Hub] No active adapters to broadcast to.');
    }
    return;
  }

  const broadcastPromises = registeredAdapters.map(async (adapter) => {
    try {
      await adapter.broadcast(event);
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Adapter Hub] Successfully broadcasted to adapter: "${adapter.name}"`,
        );
      }
    } catch (err) {
      console.error(
        `[Adapter Hub] Error broadcasting to adapter: "${adapter.name}"`,
        err,
      );
      throw err; // Re-throw so allSettled registers the failure
    }
  });

  const results = await Promise.allSettled(broadcastPromises);

  // Log summary of any failures
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const adapter = registeredAdapters[idx];
      console.error(
        `[Adapter Hub] Broadcast to "${adapter.name}" failed:`,
        result.reason,
      );
    }
  });
}
