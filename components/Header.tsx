import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BarChart3, Home } from 'lucide-react'

import logo from '../public/logo.png'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Header = () => {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between mb-10">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">pageview</h1>
        </Link>

        <nav className="flex items-center space-x-4">
          <Button
            variant={router.pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>

          <Button
            variant={router.pathname === '/analytics' ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
        </nav>
      </div>

      <div>
        <a href="https://duyet.net" target="_blank" rel="noopener noreferrer">
          <Image src={logo} alt="Logo" width={50} height={50} priority />
        </a>
      </div>
    </header>
  )
}
