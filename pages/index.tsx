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
  LayoutGrid,
  LayoutList,
  TrendingUp,
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Home({
  domainStats,
  currentHost,
  totalPageViews,
  totalUrls,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'urls'>('name')

  // Mock sparkline data - in production, fetch from API
  const mockSparklineData = [12, 19, 15, 25, 22, 30, 28]

  // Filter and sort domains
  const filteredDomains = domainStats
    .filter((domain) =>
      domain.host.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.host.localeCompare(b.host)
      }
      const countA = typeof a._count === 'number' ? a._count : 0
      const countB = typeof b._count === 'number' ? b._count : 0
      return countB - countA
    })

  return (
    <>
      <Head>
        <title>Pageview Analytics - Track Your Website Traffic</title>
        <meta
          name="description"
          content="Simple and powerful pageview tracking for your websites"
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-6">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Tracking{' '}
              <AnimatedNumber
                value={totalPageViews}
                className="font-bold"
              />{' '}
              pageviews
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Simple Analytics, Powerful Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your website traffic with privacy-focused analytics
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pageviews
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  <AnimatedNumber value={totalPageViews} separator="," />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    All-time page views
                  </p>
                  <TrendBadge value={12.5} />
                </div>
                <div className="h-16 mt-4">
                  <Sparkline data={mockSparklineData} color="#3b82f6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Domains
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  <AnimatedNumber value={domainStats.length} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Unique domains tracked
                  </p>
                  <TrendBadge value={0} showZero={false} />
                </div>
                <div className="h-16 mt-4">
                  <Sparkline
                    data={[8, 12, 10, 15, 18, 20, domainStats.length]}
                    color="#10b981"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">URLs</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  <AnimatedNumber value={totalUrls} separator="," />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Total URLs monitored
                  </p>
                  <TrendBadge value={8.3} />
                </div>
                <div className="h-16 mt-4">
                  <Sparkline
                    data={[45, 52, 48, 61, 58, 70, 65]}
                    color="#f59e0b"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Start / API Usage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Add the tracking snippet to your website to start collecting analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Usage currentHost={currentHost} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Domains List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Tracked Domains</CardTitle>
                  <CardDescription>
                    {filteredDomains.length} domain{filteredDomains.length !== 1 && 's'} found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) =>
                      value && setViewMode(value as 'grid' | 'list')
                    }
                  >
                    <ToggleGroupItem value="list" aria-label="List view">
                      <LayoutList className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDomains.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No domains found"
                  description={
                    searchQuery
                      ? `No domains match "${searchQuery}"`
                      : 'Start tracking by adding the snippet to your website'
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
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                      : 'space-y-3'
                  }
                >
                  {filteredDomains.map((row: any, index) => {
                    const hostName = row.host

                    return (
                      <motion.div
                        key={row.hostId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/domain/${hostName}`}>
                          <div className="group flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <img
                                  src={`https://www.google.com/s2/favicons?sz=256&domain=${hostName}`}
                                  alt={hostName}
                                  className="h-8 w-8 rounded"
                                />
                              </div>
                              <div>
                                <div className="font-medium group-hover:text-primary transition-colors">
                                  {hostName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {row._count} URL{row._count !== 1 && 's'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="font-mono">
                                {row._count}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
        </motion.div>
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
