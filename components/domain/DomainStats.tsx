interface DomainStatsProps {
  totalUrls: number
  totalPageviews: number
  averagePerUrl: number
}

export function DomainStats({
  totalUrls,
  totalPageviews,
  averagePerUrl,
}: DomainStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Total URLs
        </p>
        <div className="mt-2 text-2xl font-medium">{totalUrls}</div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Total Pageviews
        </p>
        <div className="mt-2 text-2xl font-medium">
          {totalPageviews.toLocaleString()}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Avg. per URL
        </p>
        <div className="mt-2 text-2xl font-medium">
          {averagePerUrl.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
