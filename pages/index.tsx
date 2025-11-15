import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Globe,
  Link as LinkIcon,
  Search,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import prisma from '../lib/prisma'
import { groupDomains, isPreviewDomain } from '../lib/domainGrouping'
import { Usage } from '../components/Usage'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { TrendBadge } from '../components/TrendBadge'
import { Sparkline } from '../components/Sparkline'
import { EmptyState } from '../components/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendsChart,
  MetricToggle,
} from '../components/charts/TrendsChart'
import { TrendData } from './api/analytics/trends'

type DomainStat = {
  hostId: number
  host: string
  _count: number
  pageViews: number
}

type Props = {
  domainStats: DomainStat[]
  currentHost: string
  totalPageViews: number
  totalUrls: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

type SortColumn = 'domain' | 'urls' | 'pageviews'
type SortDirection = 'asc' | 'desc'

export default function Home({
  domainStats,
  currentHost,
  totalPageViews,
  totalUrls,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [trendsData, setTrendsData] = useState<TrendData[]>([])
  const [trendsTotals, setTrendsTotals] = useState<{
    totalPageviews: number
    totalUniqueVisitors: number
  }>({ totalPageviews: 0, totalUniqueVisitors: 0 })
  const [loadingTrends, setLoadingTrends] = useState(true)
  const [activeMetric, setActiveMetric] = useState<
    'pageviews' | 'uniqueVisitors'
  >('pageviews')
  const [sortColumn, setSortColumn] = useState<SortColumn>('pageviews')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(true)

  // Fetch trends data for last 30 days
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch('/api/analytics/trends?days=30')
        if (response.ok) {
          const result = await response.json()
          setTrendsData(result.trends)
          setTrendsTotals({
            totalPageviews: result.totalPageviews || 0,
            totalUniqueVisitors: result.totalUniqueVisitors || 0,
          })
        }
      } catch (error) {
        console.error('Error fetching trends:', error)
      } finally {
        setLoadingTrends(false)
      }
    }

    fetchTrends()
  }, [])

  // Mock sparkline data - in production, fetch from API
  const mockSparklineData = [12, 19, 15, 25, 22, 30, 28]

  // Handle sort toggle
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column with desc as default
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Filter and sort domains
  const filteredDomains = domainStats
    .filter((domain) =>
      domain.host.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let compareA: string | number
      let compareB: string | number

      switch (sortColumn) {
        case 'domain':
          compareA = a.host.toLowerCase()
          compareB = b.host.toLowerCase()
          break
        case 'urls':
          compareA = typeof a._count === 'number' ? a._count : 0
          compareB = typeof b._count === 'number' ? b._count : 0
          break
        case 'pageviews':
          compareA = a.pageViews || 0
          compareB = b.pageViews || 0
          break
        default:
          return 0
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  // Render sort icon
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 size-3.5 opacity-40" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 size-3.5" />
    ) : (
      <ArrowDown className="ml-1 size-3.5" />
    )
  }

  return (
    <>
      <Head>
        <title>Pageview Analytics - Open, Simple & Privacy-Focused</title>
        <meta
          name="description"
          content="Modern analytics without the tracking baggage. Privacy-first pageview tracking via script, REST API, or backend. Minimal cookies, no user profiling. Open source and transparent."
        />
        <meta
          property="og:title"
          content="Pageview Analytics - Open, Simple & Privacy-Focused"
        />
        <meta
          property="og:description"
          content="Privacy-focused pageview tracking with multiple integration options. Embed a script, use the REST API, or push data directly from your backend."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Pageview Analytics - Open, Simple & Privacy-Focused"
        />
        <meta
          name="twitter:description"
          content="Modern analytics without the tracking baggage. Privacy-first pageview tracking via script, REST API, or backend."
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
        {/* Hero Section */}
        <section>
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 dark:bg-neutral-800">
              <TrendingUp className="size-3 text-neutral-500 dark:text-neutral-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                <AnimatedNumber
                  value={totalPageViews}
                  className="font-medium text-neutral-900 dark:text-neutral-100"
                />{' '}
                pageviews
              </span>
            </div>

            <h1 className="mb-3 text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
              Simple analytics, powerful insights
            </h1>

            <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
              Privacy-focused pageview tracking with multiple integration
              options. Embed a script, use the REST API, or push data directly
              from your backend.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-6 text-sm text-neutral-600 dark:text-neutral-400">
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
                <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600">
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="size-4 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Views
                    </span>
                  </div>
                  <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                    <AnimatedNumber value={totalPageViews} separator="," />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600">
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="size-4 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Domains
                    </span>
                  </div>
                  <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                    <AnimatedNumber value={domainStats.length} />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600">
                  <div className="mb-2 flex items-center gap-2">
                    <LinkIcon className="size-4 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      URLs
                    </span>
                  </div>
                  <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                    <AnimatedNumber value={totalUrls} separator="," />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Traffic Trends Chart */}
        <section>
          <div className="mx-auto max-w-4xl p-4 sm:px-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                    Traffic Trends
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Page views and unique visitors over the last 30 days
                  </p>
                </div>
                <MetricToggle
                  activeMetric={activeMetric}
                  onMetricChange={setActiveMetric}
                  totalPageviews={trendsTotals.totalPageviews}
                  totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
                />
              </div>
              <TrendsChart
                data={trendsData}
                loading={loadingTrends}
                totalPageviews={trendsTotals.totalPageviews}
                totalUniqueVisitors={trendsTotals.totalUniqueVisitors}
                activeMetric={activeMetric}
              />
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section>
          <div className="mx-auto max-w-4xl p-4 sm:px-6">
            <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50">
              <button
                onClick={() => setIsIntegrationOpen(!isIntegrationOpen)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <div>
                  <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                    Integration Guide
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Choose your preferred integration method: embed a tracking
                    script, use the REST API directly, or push data from your
                    backend
                  </p>
                </div>
                {isIntegrationOpen ? (
                  <ChevronUp className="size-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                ) : (
                  <ChevronDown className="size-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                )}
              </button>
              {isIntegrationOpen && (
                <div className="border-t border-neutral-200 p-6 pt-4 dark:border-neutral-700">
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
                <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                  Tracked Domains
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {filteredDomains.length} domain
                  {filteredDomains.length !== 1 && 's'}
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                <Input
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg border-neutral-200 pl-9 text-sm dark:border-neutral-700"
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
              <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 text-sm">
                        <button
                          onClick={() => handleSort('domain')}
                          className="inline-flex items-center font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          Domain
                          <SortIcon column="domain" />
                        </button>
                      </TableHead>
                      <TableHead className="h-10 text-right text-sm">
                        <button
                          onClick={() => handleSort('urls')}
                          className="ml-auto inline-flex items-center font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          URLs
                          <SortIcon column="urls" />
                        </button>
                      </TableHead>
                      <TableHead className="h-10 text-right text-sm">
                        <button
                          onClick={() => handleSort('pageviews')}
                          className="ml-auto inline-flex items-center font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          Pageviews
                          <SortIcon column="pageviews" />
                        </button>
                      </TableHead>
                      <TableHead className="h-10 w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDomains.map((row: any, index) => {
                      const hostName = row.host

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
                                alt={hostName}
                                className="size-5 rounded"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-500">
                                  {hostName}
                                </span>
                                {row.previewCount && (
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    +{row.previewCount} preview deployment
                                    {row.previewCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm text-neutral-600 dark:text-neutral-400">
                            {row._count}
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {row.pageViews?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Link href={`/domain/${hostName}`}>
                              <ArrowRight className="size-4 text-neutral-500 transition-transform group-hover:translate-x-0.5 dark:text-neutral-400" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const currentHost = req.headers.host as string

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
  })

  // Build host data with stats
  const hostData = hosts.map((host: any) => ({
    hostId: host.id,
    host: host.host,
    urlCount: host.urls.length,
    pageViews: host.urls.reduce(
      (sum: number, url: any) => sum + url._count.pageViews,
      0
    ),
  }))

  // Use intelligent grouping algorithm
  const allHosts = hostData.map(
    (h: {
      hostId: number
      host: string
      urlCount: number
      pageViews: number
    }) => h.host
  )
  const domainGroups = groupDomains(allHosts)

  // Build domain stats with grouping
  const groupedDomains = new Map<string, any>()

  domainGroups.forEach((groupMembers, canonical) => {
    // Find all hosts in this group
    const groupHosts = hostData.filter(
      (h: {
        hostId: number
        host: string
        urlCount: number
        pageViews: number
      }) => groupMembers.includes(h.host)
    )

    if (groupHosts.length === 0) return

    // Calculate totals for the group
    const totalUrls = groupHosts.reduce(
      (sum: number, h: { urlCount: number }) => sum + h.urlCount,
      0
    )
    const totalPageViews = groupHosts.reduce(
      (sum: number, h: { pageViews: number }) => sum + h.pageViews,
      0
    )

    // Count preview deployments (exclude canonical)
    const previewCount = groupHosts.filter(
      (h: { host: string }) => h.host !== canonical && isPreviewDomain(h.host)
    ).length

    // Find the main host (prefer canonical, or first one)
    const mainHost =
      groupHosts.find((h: { host: string }) => h.host === canonical) ||
      groupHosts[0]

    groupedDomains.set(canonical, {
      hostId: mainHost.hostId,
      host: canonical,
      _count: totalUrls,
      pageViews: totalPageViews,
      previewCount: previewCount > 0 ? previewCount : undefined,
      isGroup: groupMembers.length > 1,
    })
  })

  const domainStats = Array.from(groupedDomains.values())

  const totalPageViews = await prisma.pageView.count()
  const totalUrls = await prisma.url.count()

  return {
    props: { domainStats, currentHost, totalPageViews, totalUrls },
  }
}
