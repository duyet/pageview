import { PageHeader } from '@/components/PageHeader';

interface DomainHeaderProps {
  domain: string;
  totalPageviews: number;
  totalUrls: number;
  previewCount: number;
}

export function DomainHeader({
  domain,
  totalPageviews,
  totalUrls,
  previewCount,
}: DomainHeaderProps) {
  return (
    <PageHeader
      title={domain}
      description={
        <>
          Domain analytics and URL breakdown
          {previewCount > 0 && (
            <span className="mt-1 block text-xs">
              Including {previewCount} preview deployment
              {previewCount > 1 ? 's' : ''}
            </span>
          )}
        </>
      }
      backHref="/"
      actions={
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
              {totalUrls}
            </div>
            <div className="text-sm text-muted-foreground">Total URLs</div>
          </div>
          <div>
            <div className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
              {totalPageviews.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </div>
        </div>
      }
    />
  );
}
