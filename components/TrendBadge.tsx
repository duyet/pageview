import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

interface TrendBadgeProps {
  value: number
  suffix?: string
  className?: string
  showZero?: boolean
}

export function TrendBadge({
  value,
  suffix = '%',
  className,
  showZero = true,
}: TrendBadgeProps) {
  if (value === 0 && !showZero) return null

  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus

  return (
    <Badge
      variant={
        isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'
      }
      className={cn(
        'gap-1 font-medium',
        isNeutral && 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className="size-3" />
      <span>
        {Math.abs(value)}
        {suffix}
      </span>
    </Badge>
  )
}
