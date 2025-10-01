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

import { Prisma, Host } from '@prisma/client'

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

type DomainStat = Prisma.UrlGroupByOutputType & Host

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
        {/* Hero Section */}
        <section className="border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100/50 mb-6">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">
                  Tracking{' '}
                  <AnimatedNumber value={totalPageViews} className="font-semibold" />{' '}
                  pageviews
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-semibold text-foreground mb-4 tracking-tight">
                Simple analytics,{' '}
                <span className="text-blue-600">powerful insights</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Privacy-focused pageview tracking for modern websites. No cookies,
                no complex setup, just clean analytics.
              </p>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted/50">
                    <Zap className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted/50">
                    <Shield className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span>Private</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted/50">
                    <Clock className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span>Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Total Views
                        </span>
                      </div>
                      <TrendBadge value={12.5} />
                    </div>
                    <div className="text-3xl font-semibold text-foreground mb-3">
                      <AnimatedNumber value={totalPageViews} separator="," />
                    </div>
                    <div className="h-14">
                      <Sparkline data={mockSparklineData} color="#3b82f6" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Domains
                        </span>
                      </div>
                      <TrendBadge value={0} showZero={false} />
                    </div>
                    <div className="text-3xl font-semibold text-foreground mb-3">
                      <AnimatedNumber value={domainStats.length} />
                    </div>
                    <div className="h-14">
                      <Sparkline
                        data={[8, 12, 10, 15, 18, 20, domainStats.length]}
                        color="#10b981"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          URLs
                        </span>
                      </div>
                      <TrendBadge value={8.3} />
                    </div>
                    <div className="text-3xl font-semibold text-foreground mb-3">
                      <AnimatedNumber value={totalUrls} separator="," />
                    </div>
                    <div className="h-14">
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

        {/* Integration Section */}
        <section className="border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Start</CardTitle>
                <CardDescription className="text-sm">
                  Add this snippet to start tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Usage currentHost={currentHost} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Domains List */}
        <section className="pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">Tracked Domains</CardTitle>
                    <CardDescription className="text-sm">
                      {filteredDomains.length} domain{filteredDomains.length !== 1 && 's'}
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 text-sm border-border/50"
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
                  <div className="space-y-2.5">
                    {filteredDomains.map((row: any, index) => {
                      const hostName = row.host

                      return (
                        <motion.div
                          key={row.hostId}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link href={`/domain/${hostName}`}>
                            <div className="group flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer bg-card">
                              <div className="flex items-center space-x-3.5">
                                <img
                                  src={`https://www.google.com/s2/favicons?sz=128&domain=${hostName}`}
                                  alt={hostName}
                                  className="h-7 w-7 rounded-lg"
                                />
                                <div>
                                  <div className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                                    {hostName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {row._count} URL{row._count !== 1 && 's'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2.5">
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-xs"
                                >
                                  {row._count}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
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

  const hostIdCount = await prisma.url.groupBy({
    by: ['hostId'],
    _count: true,
    orderBy: {
      hostId: 'desc',
    },
  })

  const domainStats = await Promise.all(
    hostIdCount.map(async (row) => {
      const host = await prisma.host.findUnique({
        where: { id: row.hostId },
      })

      return {
        ...row,
        ...host,
      }
    })
  )

  const totalPageViews = await prisma.pageView.count()
  const totalUrls = await prisma.url.count()

  return {
    props: { domainStats, currentHost, totalPageViews, totalUrls },
  }
}
