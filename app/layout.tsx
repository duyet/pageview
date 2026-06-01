import type { Metadata } from 'next';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PageView Analytics',
  description:
    'Track and analyze your website pageviews with detailed analytics, geolocation, and real-time monitoring.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-[system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_Roboto,_'Helvetica_Neue',_Arial,_sans-serif]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
