import { useState } from 'react'
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

      <div className="min-h-screen">
        {/* Minimal Hero Section */}
        <section className="border-b border-border/30">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1">
                <TrendingUp className="size-3 text-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  <AnimatedNumber
                    value={totalPageViews}
                    className="font-semibold text-foreground"
                  />{' '}
                  pageviews
                </span>
              </div>

              <h1 className="mb-2 font-serif text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
                Simple analytics, powerful insights
              </h1>

              <p className="mb-5 text-sm text-muted-foreground sm:text-base">
                Privacy-focused pageview tracking. No cookies, no complex setup.
              </p>

              {/* Minimal Features */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  <span>Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Borderless Stats Grid */}
        <section className="border-b border-border/30">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 md:grid-cols-3"
            >
              <motion.div variants={item}>
                <div className="rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="size-3.5 text-foreground/40" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Total Views
                    </span>
                  </div>
                  <div className="mb-2 font-mono text-2xl font-medium text-foreground">
                    <AnimatedNumber value={totalPageViews} separator="," />
                  </div>
                  <div className="h-10">
                    <Sparkline data={mockSparklineData} color="currentColor" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <div className="mb-3 flex items-center gap-2">
                    <Globe className="size-3.5 text-foreground/40" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Domains
                    </span>
                  </div>
                  <div className="mb-2 font-mono text-2xl font-medium text-foreground">
                    <AnimatedNumber value={domainStats.length} />
                  </div>
                  <div className="h-10">
                    <Sparkline
                      data={[8, 12, 10, 15, 18, 20, domainStats.length]}
                      color="currentColor"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <div className="mb-3 flex items-center gap-2">
                    <LinkIcon className="size-3.5 text-foreground/40" />
                    <span className="text-xs font-medium text-muted-foreground">
                      URLs
                    </span>
                  </div>
                  <div className="mb-2 font-mono text-2xl font-medium text-foreground">
                    <AnimatedNumber value={totalUrls} separator="," />
                  </div>
                  <div className="h-10">
                    <Sparkline
                      data={[45, 52, 48, 61, 58, 70, 65]}
                      color="currentColor"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Borderless Integration Section */}
        <section className="border-b border-border/30">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-muted/20 p-6">
              <div className="mb-3">
                <h2 className="text-sm font-medium">Quick Start</h2>
                <p className="text-xs text-muted-foreground">
                  Add this snippet to start tracking
                </p>
              </div>
              <Usage currentHost={currentHost} />
            </div>
          </div>
        </section>

        {/* Borderless Domains List */}
        <section className="pb-6">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Tracked Domains</h2>
                <p className="text-xs text-muted-foreground">
                  {filteredDomains.length} domain
                  {filteredDomains.length !== 1 && 's'}
                </p>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border-0 bg-muted/40 pl-8 text-xs ring-0 focus-visible:ring-0"
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
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {filteredDomains.map((row: any, index) => {
                  const hostName = row.host
                  const colors = [
                    'bg-orange-50 hover:bg-orange-100',
                    'bg-emerald-50 hover:bg-emerald-100',
                    'bg-blue-50 hover:bg-blue-100',
                    'bg-purple-50 hover:bg-purple-100',
                    'bg-amber-50 hover:bg-amber-100',
                    'bg-cyan-50 hover:bg-cyan-100',
                  ]
                  const colorClass = colors[index % colors.length]

                  return (
                    <motion.div
                      key={row.hostId}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                    >
                      <Link href={`/domain/${hostName}`}>
                        <div
                          className={`group cursor-pointer rounded-2xl p-4 transition-all ${colorClass}`}
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <img
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${hostName}`}
                              alt={hostName}
                              className="size-6 rounded transition-transform group-hover:scale-110"
                            />
                            <div className="flex-1 truncate font-mono text-xs font-medium text-foreground">
                              {hostName}
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="font-mono text-xl font-medium text-foreground">
                                {row._count}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                URL{row._count !== 1 && 's'}
                              </div>
                            </div>
                            <ArrowRight className="size-4 text-foreground/40 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
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
