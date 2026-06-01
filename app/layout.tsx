import type { Metadata } from 'next'

import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'PageView Analytics',
  description:
    'Track and analyze your website pageviews with detailed analytics, geolocation, and real-time monitoring.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-neutral-50">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
