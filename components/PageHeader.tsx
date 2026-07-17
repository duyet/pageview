import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional back navigation rendered above the title */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned header controls (status badges, pickers, buttons, ...) */
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Shared page heading used by every dashboard page so titles, descriptions,
 * back-links, and header actions share one consistent treatment.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('relative', className)}>
      {backHref && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 h-8 px-2 text-sm"
        >
          <Link href={backHref}>
            <ArrowLeft className="mr-2 size-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-normal tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
