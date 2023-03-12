import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Inter } from 'next/font/google'

import { Host } from '@prisma/client'

import { Header } from '../components/Header'
import styles from '../styles/Home.module.css'
import prisma from '../lib/prisma'
import { cn } from '../lib/utils'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  domainStats: Host[]
  currentHost: string
}

export default function Home({ domainStats, currentHost }: Props) {
  return (
    <>
      <Head>
        <title>Pageview</title>
      </Head>

      <main className={cn(styles.main)}>
        <Header />

        <div className="p-10">
          <pre>GET https://{currentHost}/api/pageview?url=&lt;url&gt;</pre>
        </div>

        <div className={styles.grid}>
          {domainStats.map((row: any) => {
            return (
              <Link
                href={`/` + row.host}
                key={row.host}
                className={cn(styles.card, 'mb-4')}
              >
                <>
                  <h2 className={inter.className}>{row.host}</h2>
                  <p className={inter.className}>Pageview: {row._count.urls}</p>
                </>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const currentHost = req.headers.host as string

  const domainStats = await prisma.host.findMany({
    select: {
      host: true,
      _count: {
        select: { urls: true },
      },
    },
  })

  return {
    props: { domainStats, currentHost },
  }
}
