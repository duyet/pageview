import { Loader2 } from 'lucide-react'

interface AudienceDetail {
  name: string
  value: number
  percentage: number
}

interface AudienceListProps {
  data: AudienceDetail[]
  title: string
  loading?: boolean
}

export function AudienceListChart({ data, title, loading }: AudienceListProps) {
  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          No {title.toLowerCase()} data in this period
        </div>
      </div>
    )
  }

  // Take top 8 items
  const displayItems = data.slice(0, 8)
  const maxVal = Math.max(...displayItems.map((item) => item.value)) || 1

  return (
    <div className="h-72 overflow-y-auto pr-1">
      <div className="space-y-3.5">
        {displayItems.map((item, index) => {
          const barWidth = Math.round((item.value / maxVal) * 100)
          return (
            <div key={item.name + index} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="max-w-[70%] truncate text-neutral-700 dark:text-neutral-300">
                  {item.name}
                </span>
                <span className="shrink-0 text-neutral-900 dark:text-neutral-100">
                  {item.value.toLocaleString()}{' '}
                  <span className="font-normal text-neutral-400">
                    ({item.percentage}%)
                  </span>
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-indigo-500/80 transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
