import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
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

interface DomainUrlTableProps {
  urlStats: UrlStat[]
  totalPageviews: number
}

export function DomainUrlTable({
  urlStats,
  totalPageviews,
}: DomainUrlTableProps) {
  if (urlStats.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
            URLs
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            All tracked URLs for this domain sorted by pageviews
          </p>
        </div>
        <div className="py-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>No URLs tracked yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 sm:text-base">
          URLs
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          All tracked URLs for this domain sorted by pageviews
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 text-sm">URL</TableHead>
            <TableHead className="h-10 text-right text-sm">
              Pageviews
            </TableHead>
            <TableHead className="h-10 text-right text-sm">Share</TableHead>
            <TableHead className="h-10 w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urlStats.map((urlStat) => {
            const percentage =
              totalPageviews > 0
                ? ((urlStat._count.pageViews / totalPageviews) * 100).toFixed(
                    1
                  )
                : 0

            return (
              <TableRow key={urlStat.id} className="group">
                <TableCell className="max-w-[500px] py-3 font-mono text-sm">
                  <a
                    href={urlStat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-neutral-900 hover:text-blue-600 hover:underline dark:text-neutral-100/80"
                  >
                    <span className="truncate">{urlStat.url}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-40" />
                  </a>
                </TableCell>
                <TableCell className="py-3 text-right text-sm font-medium">
                  {urlStat._count.pageViews.toLocaleString()}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
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
    </div>
  )
}
