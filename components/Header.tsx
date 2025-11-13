import Link from 'next/link'
import { useRouter } from 'next/router'
import { BarChart3, Home, Activity, Command } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Header = () => {
  const router = useRouter()

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/realtime', icon: Activity, label: 'Real-time' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-neutral-900 transition-all dark:bg-neutral-100">
              <svg
                className="size-3.5 text-white dark:text-neutral-900"
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
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              pageview
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
