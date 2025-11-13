/**
 * Domain Analytics Page
 * Shows all URLs for a specific domain with pageview counts
 */

import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type UrlStat = {
  id: number
  url: string
  _count: {
    pageViews: number
  }
}

type DomainPageProps = {
  domain: string
  urlStats: UrlStat[]
  totalPageviews: number
}

export default function DomainPage({
  domain,
  urlStats,
  totalPageviews,
}: DomainPageProps) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {/* Compact Header */}
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-3 h-7 px-2 text-xs">
            <ArrowLeft className="mr-1.5 size-3" />
            Back
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{domain}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Domain analytics and URL breakdown
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">
              {totalPageviews.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Total Views</div>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px]">
              Total URLs
            </CardDescription>
            <CardTitle className="text-2xl">{urlStats.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px]">
              Total Pageviews
            </CardDescription>
            <CardTitle className="text-2xl">
              {totalPageviews.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px]">
              Avg. per URL
            </CardDescription>
            <CardTitle className="text-2xl">
              {urlStats.length > 0
                ? Math.round(totalPageviews / urlStats.length).toLocaleString()
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Compact URLs Table */}
      <Card className="border-border/50 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">URLs</CardTitle>
          <CardDescription className="text-xs">
            All tracked URLs for this domain sorted by pageviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {urlStats.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No URLs tracked yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-xs">URL</TableHead>
                  <TableHead className="h-9 text-right text-xs">
                    Pageviews
                  </TableHead>
                  <TableHead className="h-9 text-right text-xs">
                    Share
                  </TableHead>
                  <TableHead className="h-9 w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urlStats.map((urlStat) => {
                  const percentage =
                    totalPageviews > 0
                      ? (
                          (urlStat._count.pageViews / totalPageviews) *
                          100
                        ).toFixed(1)
                      : 0

                  return (
                    <TableRow key={urlStat.id} className="group">
                      <TableCell className="max-w-[500px] truncate py-2 font-mono text-xs">
                        <a
                          href={urlStat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-foreground/80 hover:text-blue-600 hover:underline"
                        >
                          {urlStat.url}
                          <ExternalLink className="size-2.5 opacity-40" />
                        </a>
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs font-medium">
                        {urlStat._count.pageViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px]"
                        >
                          {percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Link href={`/url/${urlStat.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { domain } = query

  // Get URL stats for this domain
  const urlStats: UrlStat[] = await prisma.url.findMany({
    where: {
      host: {
        is: {
          host: domain as string,
        },
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
  })

  // Calculate total pageviews
  const totalPageviews = urlStats.reduce(
    (sum, url) => sum + url._count.pageViews,
    0
  )

  return {
    props: {
      urlStats,
      domain,
      totalPageviews,
    },
  }
}
