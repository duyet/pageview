import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BarChart3, Home, Activity } from 'lucide-react'

import logo from '../public/logo.png'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Header = () => {
  const router = useRouter()

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/realtime', icon: Activity, label: 'Real-time' },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                P
              </span>
            </div>
            <span className="font-semibold text-lg">pageview</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Button
                key={href}
                variant={router.pathname === href ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="h-9"
              >
                <Link href={href} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <nav className="md:hidden flex items-center space-x-1">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Button
                key={href}
                variant={router.pathname === href ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="h-9 w-9 p-0"
              >
                <Link href={href} title={label}>
                  <Icon className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </nav>

          <a
            href="https://duyet.net"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2"
          >
            <Image
              src={logo}
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full hover:opacity-80 transition-opacity"
              priority
            />
          </a>
        </div>
      </div>
    </header>
  )
}
