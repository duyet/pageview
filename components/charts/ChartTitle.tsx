import { Loader2 } from 'lucide-react';

interface ChartTitleProps {
  title: string;
  description?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export function ChartTitle({
  title,
  description,
  loading,
  children,
}: ChartTitleProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground sm:text-base">
            {title}
          </h2>
          {loading && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
