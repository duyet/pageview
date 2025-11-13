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

      <div className="min-h-screen bg-background">
        {/* Compact Hero Section */}
        <section className="border-b border-border/50">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50/50 px-2.5 py-1">
                <TrendingUp className="size-3 text-blue-600" />
                <span className="text-[11px] font-medium text-blue-900">
                  <AnimatedNumber
                    value={totalPageViews}
                    className="font-semibold"
                  />{' '}
                  pageviews tracked
                </span>
              </div>

              <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Simple analytics,{' '}
                <span className="text-blue-600">powerful insights</span>
              </h1>

              <p className="mb-5 text-sm text-muted-foreground sm:text-base">
                Privacy-focused pageview tracking for modern websites. No
                cookies, no complex setup.
              </p>

              {/* Compact Features */}
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

        {/* Compact Stats Grid */}
        <section className="border-b border-border/50">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 md:grid-cols-3"
            >
              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none transition-all hover:border-border">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Total Views
                        </span>
                      </div>
                      <TrendBadge value={12.5} />
                    </div>
                    <div className="mb-2 text-2xl font-semibold text-foreground">
                      <AnimatedNumber value={totalPageViews} separator="," />
                    </div>
                    <div className="h-10">
                      <Sparkline data={mockSparklineData} color="#3b82f6" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none transition-all hover:border-border">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Domains
                        </span>
                      </div>
                      <TrendBadge value={0} showZero={false} />
                    </div>
                    <div className="mb-2 text-2xl font-semibold text-foreground">
                      <AnimatedNumber value={domainStats.length} />
                    </div>
                    <div className="h-10">
                      <Sparkline
                        data={[8, 12, 10, 15, 18, 20, domainStats.length]}
                        color="#10b981"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none transition-all hover:border-border">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          URLs
                        </span>
                      </div>
                      <TrendBadge value={8.3} />
                    </div>
                    <div className="mb-2 text-2xl font-semibold text-foreground">
                      <AnimatedNumber value={totalUrls} separator="," />
                    </div>
                    <div className="h-10">
                      <Sparkline
                        data={[45, 52, 48, 61, 58, 70, 65]}
                        color="#f59e0b"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Compact Integration Section */}
        <section className="border-b border-border/50">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Quick Start
                </CardTitle>
                <CardDescription className="text-xs">
                  Add this snippet to start tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Usage currentHost={currentHost} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Compact Domains List */}
        <section className="pb-6">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Tracked Domains
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {filteredDomains.length} domain
                      {filteredDomains.length !== 1 && 's'}
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 border-border/50 pl-8 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
                  <div className="space-y-1.5">
                    {filteredDomains.map((row: any, index) => {
                      const hostName = row.host

                      return (
                        <motion.div
                          key={row.hostId}
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <Link href={`/domain/${hostName}`}>
                            <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-all hover:border-border hover:bg-muted/30">
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={`https://www.google.com/s2/favicons?sz=128&domain=${hostName}`}
                                  alt={hostName}
                                  className="size-5 rounded"
                                />
                                <div>
                                  <div className="text-xs font-medium text-foreground transition-colors group-hover:text-blue-600">
                                    {hostName}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {row._count} URL{row._count !== 1 && 's'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 font-mono text-[10px]"
                                >
                                  {row._count}
                                </Badge>
                                <ArrowRight className="size-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
