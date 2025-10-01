import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import { Toaster } from 'sonner'

import '../styles/globals.css'
import { Header } from '../components/Header'
import { CommandPalette } from '../components/CommandPalette'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Component {...pageProps} />

      <CommandPalette />
      <Toaster position="top-right" richColors />

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Script id="pageview" strategy="afterInteractive">
        {`
          !function(e,n,t){e.onload=function(){
          let e=n.createElement("script");
          e.src=t,n.body.appendChild(e)}}
          (window,document,"/pageview.js");
        `}
      </Script>
    </main>
  )
}
