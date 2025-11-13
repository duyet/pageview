import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { RealtimeMetrics } from '../types/socket'

interface RealtimeTableProps {
  title: string
  data: Array<{
    name?: string
    path?: string
    country?: string
    views?: number
    count?: number
  }>
  loading?: boolean
  emptyMessage?: string
}

export function RealtimeTable({
  title,
  data,
  loading,
  emptyMessage = 'No data available',
}: RealtimeTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="mr-4 h-4 flex-1 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {data[0]?.path ? 'Page' : data[0]?.country ? 'Country' : 'Item'}
              </TableHead>
              <TableHead className="text-right">
                {data[0]?.views !== undefined ? 'Views' : 'Count'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.path || item.country || item.name || 'Unknown'}
                </TableCell>
                <TableCell className="text-right">
                  {(item.views || item.count || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Pre-configured tables for common use cases
export function ActivePagesTable({
  data,
  loading,
}: {
  data: RealtimeMetrics['activePages']
  loading?: boolean
}) {
  return (
    <RealtimeTable
      title="Most Active Pages (Last Hour)"
      data={data}
      loading={loading}
      emptyMessage="No active pages in the last hour"
    />
  )
}

export function RecentCountriesTable({
  data,
  loading,
}: {
  data: RealtimeMetrics['recentCountries']
  loading?: boolean
}) {
  return (
    <RealtimeTable
      title="Recent Countries (Last Hour)"
      data={data}
      loading={loading}
      emptyMessage="No recent visitors from any countries"
    />
  )
}
