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

// Applies the persisted (or system) theme before first paint to avoid a
// flash of the wrong theme. Kept dependency-free on purpose.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static theme bootstrap (no user input) — runs before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-[system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_Roboto,_'Helvetica_Neue',_Arial,_sans-serif]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
