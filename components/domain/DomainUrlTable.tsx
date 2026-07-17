import { ExternalLink, Link2 } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UrlStat = {
  id: number;
  url: string;
  _count: {
    pageViews: number;
  };
};

interface DomainUrlTableProps {
  urlStats: UrlStat[];
  totalPageviews: number;
}

export function DomainUrlTable({
  urlStats,
  totalPageviews,
}: DomainUrlTableProps) {
  return (
    <SectionCard
      title="URLs"
      description="All tracked URLs for this domain sorted by pageviews"
    >
      {urlStats.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No URLs tracked yet"
          description="URLs will appear here once pageviews are recorded for this domain"
        />
      ) : (
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
                      1,
                    )
                  : 0;

              return (
                <TableRow key={urlStat.id} className="group">
                  <TableCell className="max-w-[500px] py-3 font-mono text-sm">
                    <a
                      href={urlStat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-foreground hover:text-primary hover:underline"
                    >
                      <span className="truncate">{urlStat.url}</span>
                      <ExternalLink className="size-3 shrink-0 opacity-40" />
                    </a>
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm font-medium tabular-nums">
                    {urlStat._count.pageViews.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Badge
                      variant="secondary"
                      className="h-5 px-2 text-xs tabular-nums"
                    >
                      {percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs"
                    >
                      <Link href={`/url/${urlStat.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
