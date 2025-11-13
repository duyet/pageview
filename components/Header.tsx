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
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center space-x-2"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm transition-shadow group-hover:shadow">
              <svg
                className="h-4.5 w-4.5 text-white"
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
            <span className="text-[15px] font-semibold text-foreground">
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
                    'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}

            {/* Command Palette Hint */}
            <button
              className="ml-2 hidden items-center space-x-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground md:inline-flex"
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                })
                document.dispatchEvent(event)
              }}
            >
              <Command className="size-3.5" />
              <span className="text-xs">⌘K</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
