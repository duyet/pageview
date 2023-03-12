import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'

import { Url } from '@prisma/client'
import { Header } from '../components/Header'
import styles from '../styles/Domain.module.css'
import prisma from '../lib/prisma'

const inter = Inter({ subsets: ['latin'] })

type URLStatsProps = {
  domain: String
  urlStats: Url[]
}

export default function Home({ domain, urlStats }: URLStatsProps) {
  return (
    <>
      <Header />

      <div className={styles.grid}>
        {urlStats.map((row: any) => {
          return (
            <div key={row.host} className={styles.card}>
              <h2 className={inter.className}>
                <Link href={row.url} target="_blank">
                  {row.url}
                </Link>
              </h2>
              <p className={inter.className}>
                Pageview: {row._count.pageViews}
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { domain } = query

  const urlStats = await prisma.url.findMany({
    where: {
      host: {
        is: {
          host: domain as string,
        },
      },
    },
    select: {
      url: true,
      _count: true,
    },
  })

  return {
    props: { urlStats, domain },
  }
}
