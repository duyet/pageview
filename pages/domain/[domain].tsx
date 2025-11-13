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
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Domains
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{domain}</h1>
            <p className="mt-1 text-muted-foreground">
              Domain analytics and URL breakdown
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {totalPageviews.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Pageviews</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total URLs</CardDescription>
            <CardTitle className="text-3xl">{urlStats.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pageviews</CardDescription>
            <CardTitle className="text-3xl">
              {totalPageviews.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg. per URL</CardDescription>
            <CardTitle className="text-3xl">
              {urlStats.length > 0
                ? Math.round(totalPageviews / urlStats.length).toLocaleString()
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>URLs</CardTitle>
          <CardDescription>
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
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Pageviews</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
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
                    <TableRow key={urlStat.id}>
                      <TableCell className="max-w-[500px] truncate font-mono text-sm">
                        <a
                          href={urlStat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {urlStat.url}
                          <ExternalLink className="size-3 opacity-50" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {urlStat._count.pageViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{percentage}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/url/${urlStat.id}`}>
                          <Button variant="outline" size="sm">
                            Details
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
