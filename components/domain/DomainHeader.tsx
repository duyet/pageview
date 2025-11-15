import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DomainHeaderProps {
  domain: string
  totalPageviews: number
  totalUrls: number
  previewCount: number
}

export function DomainHeader({
  domain,
  totalPageviews,
  totalUrls,
  previewCount,
}: DomainHeaderProps) {
  return (
    <div>
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4 h-8 px-2 text-sm">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
            {domain}
          </h1>
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Domain analytics and URL breakdown
            </p>
            {previewCount > 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Including {previewCount} preview deployment
                {previewCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
              {totalUrls}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Total URLs
            </div>
          </div>
          <div>
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 sm:text-2xl">
              {totalPageviews.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Total Views
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
