import type { GetServerSideProps } from 'next'
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
      <Header />

      <div className="text-center p-10">
        <pre>GET https://{currentHost}/api/pageview?url=&lt;url&gt;</pre>
      </div>

      <div className="grid">
        {domainStats.map((row: any) => {
          return (
            <Link
              href={`/` + row.host}
              key={row.host}
              className={cn(styles.card, 'mb-4')}
            >
              <>
                <h2 className={cn(inter.className, 'flex')}>
                  <img
                    src={`https://www.google.com/s2/favicons?sz=256&domain=${row.host}`}
                    alt={row.host}
                    className="mr-2 h-6 w-6"
                  />
                  {row.host}
                </h2>
                <p className={inter.className}>Pageview: {row._count.urls}</p>
              </>
            </Link>
          )
        })}
      </div>
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
