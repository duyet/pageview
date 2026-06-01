/**
 * Domain Analytics Page (App Router)
 * Shows all URLs for a specific domain with pageview counts
 */

import type { Metadata } from 'next';
import { analyzeDomain } from '@/lib/domainGrouping';
import prisma from '@/lib/prisma';
import { DomainClient } from './domain-client';

export type UrlStat = {
  id: number;
  url: string;
  _count: {
    pageViews: number;
  };
};

export type DomainPageProps = {
  domain: string;
  urlStats: UrlStat[];
  totalPageviews: number;
  previewCount: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  return {
    title: `${domain} - PageView Analytics`,
    description: `Analytics for ${domain}`,
  };
}

/**
 * Helper function to detect preview subdomains and find related domains
 * Uses intelligent token-based analysis instead of hardcoded patterns
 */
function findRelatedDomains(
  targetDomain: string,
  allDomains: string[],
): string[] {
  const targetAnalysis = analyzeDomain(targetDomain);
  const related: string[] = [targetDomain];

  for (const domain of allDomains) {
    if (domain === targetDomain) continue;

    const analysis = analyzeDomain(domain);

    const targetTokens = new Set(targetAnalysis.projectTokens);
    const domainTokens = new Set(analysis.projectTokens);
    const targetTokensArray = Array.from(targetTokens);
    const intersection = new Set(
      targetTokensArray.filter((t) => domainTokens.has(t)),
    );

    const similarity =
      targetTokens.size > 0
        ? intersection.size / Math.min(targetTokens.size, domainTokens.size)
        : 0;

    if (similarity >= 0.6) {
      related.push(domain);
    }
  }

  return related;
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: requestedDomain } = await params;

  // Get all hosts to analyze
  const allHosts = await prisma.host.findMany({
    select: {
      id: true,
      host: true,
    },
  });

  // Find all domains related to the requested domain
  const allHostnames = allHosts.map(
    (h: { id: number; host: string }) => h.host,
  );
  const relatedDomains = findRelatedDomains(requestedDomain, allHostnames);

  // Get IDs of all related hosts
  const matchingHostIds = allHosts
    .filter((host: { id: number; host: string }) =>
      relatedDomains.includes(host.host),
    )
    .map((host: { id: number; host: string }) => host.id);

  // Count preview deployments (all related domains except the requested one)
  const previewCount = relatedDomains.filter((d) => {
    if (d === requestedDomain) return false;
    const analysis = analyzeDomain(d);
    return analysis.isPreview;
  }).length;

  // Get URL stats for all matching hosts
  const urlStats: UrlStat[] = await prisma.url.findMany({
    where: {
      hostId: {
        in: matchingHostIds,
      },
    },
    select: {
      id: true,
      url: true,
      _count: true,
    },
    orderBy: {
      pageViews: { _count: 'desc' },
    },
  });

  // Calculate total pageviews
  const totalPageviews = urlStats.reduce(
    (sum, url) => sum + url._count.pageViews,
    0,
  );

  return (
    <DomainClient
      domain={requestedDomain}
      urlStats={urlStats}
      totalPageviews={totalPageviews}
      previewCount={previewCount}
    />
  );
}
