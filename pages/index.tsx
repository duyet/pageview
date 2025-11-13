import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Globe,
  Link as LinkIcon,
  Search,
  TrendingUp,
  Zap,
  Shield,
  Clock,
} from 'lucide-react'

import prisma from '../lib/prisma'
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
import { TrendsChart } from '../components/charts/TrendsChart'
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

export default function Home({
  domainStats,
  currentHost,
  totalPageViews,
  totalUrls,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [trendsData, setTrendsData] = useState<TrendData[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)

  // Fetch trends data for last 30 days
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch('/api/analytics/trends?days=30')
        if (response.ok) {
          const result = await response.json()
          setTrendsData(result.trends)
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

  // Filter domains
  const filteredDomains = domainStats
    .filter((domain) =>
      domain.host.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const countA = typeof a._count === 'number' ? a._count : 0
      const countB = typeof b._count === 'number' ? b._count : 0
      return countB - countA
    })

  return (
    <>
      <Head>
        <title>Pageview Analytics - Simple & Privacy-Focused</title>
        <meta
          name="description"
          content="Lightweight pageview tracking for modern websites"
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900">
        {/* Hero Section */}
        <section className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
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
              Privacy-focused pageview tracking. No cookies, no complex setup.
            </p>

            {/* Features */}
            <div className="flex gap-6 text-sm text-neutral-600 dark:text-neutral-400">
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
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
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
        <section className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Traffic Trends
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Page views and unique visitors over the last 30 days
                </p>
              </div>
              <TrendsChart data={trendsData} loading={loadingTrends} />
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
                  Quick Start
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Add this snippet to start tracking
                </p>
              </div>
              <Usage currentHost={currentHost} />
            </div>
          </div>
        </section>

        {/* Tracked Domains List */}
        <section className="pb-12">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <TableHead className="h-10 text-sm">Domain</TableHead>
                      <TableHead className="h-10 text-right text-sm">
                        URLs
                      </TableHead>
                      <TableHead className="h-10 text-right text-sm">
                        Pageviews
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
                              <span className="text-sm font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-500">
                                {hostName}
                              </span>
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

  // Calculate stats for each domain
  const domainStats = hosts
    .map((host: any) => ({
      hostId: host.id,
      host: host.host,
      _count: host.urls.length,
      pageViews: host.urls.reduce(
        (sum: number, url: any) => sum + url._count.pageViews,
        0
      ),
    }))
    .filter((stat: any) => stat._count > 0) // Only show domains with URLs

  const totalPageViews = await prisma.pageView.count()
  const totalUrls = await prisma.url.count()

  return {
    props: { domainStats, currentHost, totalPageViews, totalUrls },
  }
}
