import { Activity, BarChart3, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DataSourceSelector } from './DataSourceSelector';

export const Header = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/realtime', icon: Activity, label: 'Real-time' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <svg
                className="size-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              pageview
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-0.5 rounded-lg bg-secondary/60 p-0.5">
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all',
                      isActive
                        ? 'bg-card text-foreground anthropic-shadow'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Global database source selector */}
            <DataSourceSelector />
          </div>
        </div>
      </div>
    </header>
  );
};
