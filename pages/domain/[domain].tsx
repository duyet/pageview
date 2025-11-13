/**
 * Domain Analytics Page
 * Shows all URLs for a specific domain with pageview counts
 */

import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 h-8 px-2 text-sm"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-normal tracking-tight">
                  {domain}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Domain analytics and URL breakdown
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-medium">
                  {totalPageviews.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/40 bg-background p-4">
              <p className="text-sm text-muted-foreground">Total URLs</p>
              <div className="mt-2 text-2xl font-medium">{urlStats.length}</div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background p-4">
              <p className="text-sm text-muted-foreground">Total Pageviews</p>
              <div className="mt-2 text-2xl font-medium">
                {totalPageviews.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background p-4">
              <p className="text-sm text-muted-foreground">Avg. per URL</p>
              <div className="mt-2 text-2xl font-medium">
                {urlStats.length > 0
                  ? Math.round(
                      totalPageviews / urlStats.length
                    ).toLocaleString()
                  : 0}
              </div>
            </div>
          </div>

          {/* URLs Table */}
          <div className="rounded-lg border border-border/40 bg-background p-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium">URLs</h2>
              <p className="text-sm text-muted-foreground">
                All tracked URLs for this domain sorted by pageviews
              </p>
            </div>
            {urlStats.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <p>No URLs tracked yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-sm">URL</TableHead>
                    <TableHead className="h-10 text-right text-sm">
                      Pageviews
                    </TableHead>
                    <TableHead className="h-10 text-right text-sm">
                      Share
                    </TableHead>
                    <TableHead className="h-10 w-[80px]"></TableHead>
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
                        <TableCell className="max-w-[500px] truncate py-3 font-mono text-sm">
                          <a
                            href={urlStat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-blue-600 hover:underline"
                          >
                            {urlStat.url}
                            <ExternalLink className="size-3 opacity-40" />
                          </a>
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm font-medium">
                          {urlStat._count.pageViews.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-xs"
                          >
                            {percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Link href={`/url/${urlStat.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-xs"
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
          </div>
        </div>
      </div>
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
