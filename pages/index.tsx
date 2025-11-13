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

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
        {/* Claude-style Hero Section */}
        <section className="border-b border-border/20">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5">
              <TrendingUp className="size-3 text-foreground/40" />
              <span className="text-xs text-muted-foreground">
                <AnimatedNumber
                  value={totalPageViews}
                  className="font-medium text-foreground/80"
                />{' '}
                pageviews
              </span>
            </div>

            <h1 className="mb-3 text-2xl font-normal tracking-tight text-foreground">
              Simple analytics, powerful insights
            </h1>

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Privacy-focused pageview tracking. No cookies, no complex setup.
            </p>

            {/* Features */}
            <div className="flex gap-6 text-sm text-muted-foreground">
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
        <section className="border-b border-border/20">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <motion.div variants={item}>
                <div className="rounded-lg border border-border/40 bg-background p-4 transition-colors hover:border-border">
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total Views
                    </span>
                  </div>
                  <div className="text-2xl font-medium text-foreground">
                    <AnimatedNumber value={totalPageViews} separator="," />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-lg border border-border/40 bg-background p-4 transition-colors hover:border-border">
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Domains
                    </span>
                  </div>
                  <div className="text-2xl font-medium text-foreground">
                    <AnimatedNumber value={domainStats.length} />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="rounded-lg border border-border/40 bg-background p-4 transition-colors hover:border-border">
                  <div className="mb-2 flex items-center gap-2">
                    <LinkIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">URLs</span>
                  </div>
                  <div className="text-2xl font-medium text-foreground">
                    <AnimatedNumber value={totalUrls} separator="," />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="border-b border-border/20">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="rounded-lg border border-border/40 bg-background p-6">
              <div className="mb-4">
                <h2 className="text-sm font-medium">Quick Start</h2>
                <p className="text-sm text-muted-foreground">
                  Add this snippet to start tracking
                </p>
              </div>
              <Usage currentHost={currentHost} />
            </div>
          </div>
        </section>

        {/* Tracked Domains List */}
        <section className="pb-12">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium">Tracked Domains</h2>
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
                  className="h-9 rounded-lg border-border/40 pl-9 text-sm"
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
              <div className="space-y-2">
                {filteredDomains.map((row: any, index) => {
                  const hostName = row.host

                  return (
                    <motion.div
                      key={row.hostId}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                    >
                      <Link href={`/domain/${hostName}`}>
                        <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-border/40 bg-background p-4 transition-all hover:border-border">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${hostName}`}
                              alt={hostName}
                              className="size-5 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {hostName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {row._count} URL{row._count !== 1 && 's'}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
