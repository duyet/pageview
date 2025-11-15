import Link from 'next/link'
import { useRouter } from 'next/router'
import { BarChart3, Home, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Header = () => {
  const router = useRouter()

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/realtime', icon: Activity, label: 'Real-time' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group -ml-2 flex items-center space-x-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-700 shadow-sm transition-all group-hover:shadow-md dark:from-neutral-100 dark:to-neutral-300">
              <svg
                className="size-4 text-white dark:text-neutral-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              pageview
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 transition-transform group-hover:scale-110',
                      isActive && 'text-neutral-900 dark:text-neutral-100'
                    )}
                  />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
