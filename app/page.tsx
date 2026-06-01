import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { groupDomains, isPreviewDomain } from '@/lib/domainGrouping';
import prisma from '@/lib/prisma';
import { HomepageClient } from './homepage-client';

export const metadata: Metadata = {
  title: 'PageView Analytics - Website Traffic Tracker',
  description:
    'Modern analytics without the tracking baggage. Privacy-first pageview tracking via script, REST API, or backend. Minimal cookies, no user profiling. Open source and transparent.',
};

export default async function Page() {
  const headersList = await headers();
  const currentHost = headersList.get('host') || '';

  // OPTIMIZED: Get domains with stats using joins (NO N+1)
  const hosts = await prisma.host.findMany({
    select: {
      id: true,
      host: true,
      urls: {
        select: {
          id: true,
          _count: {
            select: {
              pageViews: true,
            },
          },
        },
      },
    },
  });

  // Build host data with stats
  const hostData = hosts.map((host: any) => ({
    hostId: host.id,
    host: host.host,
    urlCount: host.urls.length,
    pageViews: host.urls.reduce(
      (sum: number, url: any) => sum + url._count.pageViews,
      0,
    ),
  }));

  // Use intelligent grouping algorithm
  const allHosts = hostData.map(
    (h: {
      hostId: number;
      host: string;
      urlCount: number;
      pageViews: number;
    }) => h.host,
  );
  const domainGroups = groupDomains(allHosts);

  // Build domain stats with grouping
  const groupedDomains = new Map<string, any>();

  domainGroups.forEach((groupMembers, canonical) => {
    // Find all hosts in this group
    const groupHosts = hostData.filter(
      (h: {
        hostId: number;
        host: string;
        urlCount: number;
        pageViews: number;
      }) => groupMembers.includes(h.host),
    );

    if (groupHosts.length === 0) return;

    // Calculate totals for the group
    const totalUrls = groupHosts.reduce(
      (sum: number, h: { urlCount: number }) => sum + h.urlCount,
      0,
    );
    const totalPageViews = groupHosts.reduce(
      (sum: number, h: { pageViews: number }) => sum + h.pageViews,
      0,
    );

    // Count preview deployments (exclude canonical)
    const previewCount = groupHosts.filter(
      (h: { host: string }) => h.host !== canonical && isPreviewDomain(h.host),
    ).length;

    // Find the main host (prefer canonical, or first one)
    const mainHost =
      groupHosts.find((h: { host: string }) => h.host === canonical) ||
      groupHosts[0];

    groupedDomains.set(canonical, {
      hostId: mainHost.hostId,
      host: canonical,
      _count: totalUrls,
      pageViews: totalPageViews,
      previewCount: previewCount > 0 ? previewCount : undefined,
      isGroup: groupMembers.length > 1,
    });
  });

  const domainStats = Array.from(groupedDomains.values());

  const totalPageViews = await prisma.pageView.count();
  const totalUrls = await prisma.url.count();

  return (
    <HomepageClient
      domainStats={domainStats}
      currentHost={currentHost}
      totalPageViews={totalPageViews}
      totalUrls={totalUrls}
    />
  );
}
