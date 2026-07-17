import { ChartTitle } from '@/components/charts/ChartTitle';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  /** Optional section heading rendered via ChartTitle for consistency */
  title?: string;
  description?: string;
  /** Shows the inline loading spinner next to the title */
  loading?: boolean;
  /** Right-aligned header controls (toggles, pickers, ...) */
  actions?: React.ReactNode;
  /** Card padding: `lg` (p-6) for primary sections, `md` (p-4) for grid cells */
  padding?: 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared card chrome for dashboard sections.
 *
 * Every content block across the app (charts, tables, stat tiles) uses this
 * single surface — `rounded-lg border bg-card` — so pages stay visually
 * cohesive. Prefer this over hand-rolling `div` shells or the shadcn `Card`
 * (which carries its own radius/shadow and reads as a different surface).
 */
export function SectionCard({
  title,
  description,
  loading,
  actions,
  padding = 'lg',
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-card',
        padding === 'lg' ? 'p-6' : 'p-4',
        className,
      )}
    >
      {title && (
        <ChartTitle title={title} description={description} loading={loading}>
          {actions}
        </ChartTitle>
      )}
      {children}
    </section>
  );
}
