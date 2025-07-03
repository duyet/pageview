import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Globe, Link as LinkIcon } from 'lucide-react'

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

type DomainStat = Prisma.UrlGroupByOutputType & Host

type Props = {
  domainStats: DomainStat[]
  currentHost: string
  totalPageViews: number
  totalUrls: number
}

export default function Home({
  domainStats,
  currentHost,
  totalPageViews,
  totalUrls,
}: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pageviews
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time page views tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domainStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique domains tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">URLs</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUrls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total URLs monitored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Usage Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>
            Track page views by making GET requests to the endpoint below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            GET https://{currentHost}/api/pageview?url=&lt;url&gt;
          </div>
        </CardContent>
      </Card>

      {/* Usage Component */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <Usage currentHost={currentHost} />
        </CardContent>
      </Card>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Domains</CardTitle>
          <CardDescription>
            Click on a domain to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {domainStats.map((row: any) => {
              const hostName = row.host

              return (
                <Link href={`/domain/${hostName}`} key={row.hostId}>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=256&domain=${hostName}`}
                        alt={hostName}
                        className="h-6 w-6 rounded"
                      />
                      <div>
                        <div className="font-medium">{hostName}</div>
                        <div className="text-sm text-muted-foreground">
                          URLs: {row._count}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{row._count} URLs</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
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
  console.log('Domain Stats:', domainStats)

  const totalPageViews = await prisma.pageView.count()

  const totalUrls = await prisma.url.count()

  return {
    props: { domainStats, currentHost, totalPageViews, totalUrls },
  }
}
