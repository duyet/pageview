'use client';

import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  Clock,
  Globe,
  Link as LinkIcon,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { MetricToggle, TrendsChart } from '@/components/charts/TrendsChart';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Usage } from '@/components/Usage';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTrendsData } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

type DomainStat = {
  hostId: number;
  host: string;
  _count: number;
  pageViews: number;
  previewCount?: number;
  isGroup?: boolean;
};

export interface HomepageProps {
  domainStats: DomainStat[];
  currentHost: string;
  totalPageViews: number;
  totalUrls: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

type SortColumn = 'domain' | 'urls' | 'pageviews';
type SortDirection = 'asc' | 'desc';

export function HomepageClient({
  domainStats,
  currentHost,
  totalPageViews,
  totalUrls,
}: HomepageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMetric, setActiveMetric] = useState<
    'pageviews' | 'uniqueVisitors'
  >('pageviews');
  const [sortColumn, setSortColumn] = useState<SortColumn>('pageviews');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(true);

  // Fetch trends data for last 30 days using React Query
  const {
    data: trendsResult,
    isLoading: loadingTrends,
    isFetching: fetchingTrends,
  } = useTrendsData(30);

  const trendsData = trendsResult?.trends || [];
  const trendsTotals = {
    totalPageviews: trendsResult?.totalPageviews || 0,
    totalUniqueVisitors: trendsResult?.totalUniqueVisitors || 0,
  };

  // Handle sort toggle
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Filter and sort domains
  const filteredDomains = domainStats
    .filter((domain) =>
      domain.host.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      let compareA: string | number;
      let compareB: string | number;

      switch (sortColumn) {
        case 'domain':
          compareA = a.host.toLowerCase();
          compareB = b.host.toLowerCase();
          break;
        case 'urls':
          compareA = typeof a._count === 'number' ? a._count : 0;
          compareB = typeof b._count === 'number' ? b._count : 0;
          break;
        case 'pageviews':
          compareA = a.pageViews || 0;
          compareB = b.pageViews || 0;
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Render sort icon
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 size-3.5 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 size-3.5" />
    ) : (
      <ArrowDown className="ml-1 size-3.5" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5">
            <TrendingUp className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <AnimatedNumber
                value={totalPageViews}
                className="font-medium text-foreground"
              />{' '}
              pageviews
            </span>
          </div>

          <h1 className="mb-3 text-xl font-normal tracking-tight text-foreground sm:text-2xl">
            Simple analytics, powerful insights
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Privacy-focused pageview tracking with multiple integration options.
            Embed a script, use the REST API, or push data directly from your
            backend.
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="size-4" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>Real-time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon className="size-4" />
              <span>REST API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <div className="mx-auto max-w-4xl p-4 sm:px-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <motion.div variants={item}>
              <SectionCard
                padding="md"
                className="transition-colors hover:border-border/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Views
                  </span>
                </div>
                <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
                  <AnimatedNumber value={totalPageViews} separator="," />
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item}>
              <SectionCard
                padding="md"
                className="transition-colors hover:border-border/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Domains</span>
                </div>
                <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
                  <AnimatedNumber value={domainStats.length} />
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item}>
              <SectionCard
                padding="md"
                className="transition-colors hover:border-border/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <LinkIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">URLs</span>
                </div>
                <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
                  <AnimatedNumber value={totalUrls} separator="," />
                </div>
              </SectionCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Traffic Trends Chart */}
      <section>
        <div className="mx-auto max-w-4xl p-4 sm:px-6">
          <SectionCard
            title="Traffic Trends"
            description="Page views and unique visitors over the last 30 days"
            loading={fetchingTrends}
            actions={
              <MetricToggle
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                totalPageviews={trendsTotals.totalPageviews}
                totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              />
            }
          >
            <TrendsChart
              data={trendsData}
              loading={loadingTrends}
              totalPageviews={trendsTotals.totalPageviews}
              totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
              activeMetric={activeMetric}
            />
          </SectionCard>
        </div>
      </section>

      {/* Quick Start Section */}
      <section>
        <div className="mx-auto max-w-4xl p-4 sm:px-6">
          <div className="rounded-lg border border-border bg-card">
            <button
              onClick={() => setIsIntegrationOpen(!isIntegrationOpen)}
              aria-expanded={isIntegrationOpen}
              className={cn(
                'flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isIntegrationOpen ? 'rounded-t-lg' : 'rounded-lg',
              )}
            >
              <div>
                <h2 className="text-sm font-medium text-foreground sm:text-base">
                  Integration Guide
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred integration method: embed a tracking
                  script, use the REST API directly, or push data from your
                  backend
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 shrink-0 text-muted-foreground transition-transform',
                  isIntegrationOpen && 'rotate-180',
                )}
              />
            </button>
            {isIntegrationOpen && (
              <div className="border-t border-border p-6 pt-4">
                <Usage currentHost={currentHost} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tracked Domains List */}
      <section className="pb-8">
        <div className="mx-auto max-w-4xl p-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-medium text-foreground">
                Tracked Domains
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredDomains.length} domain
                {filteredDomains.length !== 1 && 's'}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border-border pl-9 text-sm"
              />
            </div>
          </div>

          {filteredDomains.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No domains found"
              description={
                searchQuery
                  ? `No domains match "${searchQuery}"`
                  : 'Add the tracking snippet to start'
              }
              action={
                searchQuery
                  ? {
                      label: 'Clear search',
                      onClick: () => setSearchQuery(''),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-sm">
                      <button
                        onClick={() => handleSort('domain')}
                        className="-mx-1.5 inline-flex items-center rounded-md px-1.5 py-1.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Domain
                        <SortIcon column="domain" />
                      </button>
                    </TableHead>
                    <TableHead className="h-10 text-right text-sm">
                      <button
                        onClick={() => handleSort('urls')}
                        className="-mx-1.5 ml-auto inline-flex items-center rounded-md px-1.5 py-1.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        URLs
                        <SortIcon column="urls" />
                      </button>
                    </TableHead>
                    <TableHead className="h-10 text-right text-sm">
                      <button
                        onClick={() => handleSort('pageviews')}
                        className="-mx-1.5 ml-auto inline-flex items-center rounded-md px-1.5 py-1.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Pageviews
                        <SortIcon column="pageviews" />
                      </button>
                    </TableHead>
                    <TableHead className="h-10 w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains.map((row, _index) => {
                    const hostName = row.host;

                    return (
                      <TableRow key={row.hostId} className="group">
                        <TableCell className="py-3">
                          <Link
                            href={`/domain/${hostName}`}
                            className="flex items-center gap-3"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${hostName}`}
                              alt=""
                              className="size-5 rounded outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground hover:text-primary">
                                {hostName}
                              </span>
                              {row.previewCount && (
                                <span className="text-xs text-muted-foreground">
                                  +{row.previewCount} preview deployment
                                  {row.previewCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm tabular-nums text-muted-foreground">
                          {row._count}
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm font-medium tabular-nums text-foreground">
                          {row.pageViews?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Link href={`/domain/${hostName}`}>
                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
