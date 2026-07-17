import { SectionCard } from '@/components/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { RealtimeMetrics } from '../types/socket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface RealtimeTableProps {
  title: string;
  description?: string;
  data: Array<{
    name?: string;
    path?: string;
    country?: string;
    views?: number;
    count?: number;
  }>;
  loading?: boolean;
  emptyMessage?: string;
}

export function RealtimeTable({
  title,
  description,
  data,
  loading,
  emptyMessage = 'No data available',
}: RealtimeTableProps) {
  return (
    <SectionCard title={title} description={description}>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 text-sm">
                {data[0]?.path ? 'Page' : data[0]?.country ? 'Country' : 'Item'}
              </TableHead>
              <TableHead className="h-10 text-right text-sm">
                {data[0]?.views !== undefined ? 'Views' : 'Count'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="py-3 text-sm font-medium">
                  {item.path || item.country || item.name || 'Unknown'}
                </TableCell>
                <TableCell className="py-3 text-right text-sm tabular-nums">
                  {(item.views || item.count || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}

// Pre-configured tables for common use cases
export function ActivePagesTable({
  data,
  loading,
}: {
  data: RealtimeMetrics['activePages'];
  loading?: boolean;
}) {
  return (
    <RealtimeTable
      title="Most Active Pages"
      description="Last hour"
      data={data}
      loading={loading}
      emptyMessage="No active pages in the last hour"
    />
  );
}

export function RecentCountriesTable({
  data,
  loading,
}: {
  data: RealtimeMetrics['recentCountries'];
  loading?: boolean;
}) {
  return (
    <RealtimeTable
      title="Recent Countries"
      description="Last hour"
      data={data}
      loading={loading}
      emptyMessage="No recent visitors from any countries"
    />
  );
}
