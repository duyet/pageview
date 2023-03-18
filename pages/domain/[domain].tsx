import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Card, Flex, Button, Divider, Title } from '@tremor/react'
import { BarList, Text, Bold } from '@tremor/react'
import { ArrowNarrowLeftIcon } from '@heroicons/react/solid'

import { Prisma, Url } from '@prisma/client'
import prisma from '../../lib/prisma'

type UrlStat = {
  id: number
  url: string
  _count: Prisma.UrlCountOutputType
}

type URLStatsProps = {
  domain: String
  urlStats: UrlStat[]
}

export default function Home({ domain, urlStats }: URLStatsProps) {
  return (
    <Card>
      <Title>
        <Link href="/">
          <Button
            size="sm"
            variant="light"
            icon={ArrowNarrowLeftIcon}
            iconPosition="left"
          >
            {domain}
          </Button>
        </Link>
      </Title>

      <Text>Total URL: {urlStats.length}</Text>

      <Divider />

      <Flex className="mt-4">
        <Text>
          <Bold>URL</Bold>
        </Text>
        <Text>
          <Bold>PageView</Bold>
        </Text>
      </Flex>

      <BarList
        className="mt-2"
        data={urlStats.map((row: any) => {
          return {
            name: row.url,
            value: row._count.pageViews,
            href: `/url/${row.id}`,
            target: '_self',
          }
        })}
      />
    </Card>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { domain } = query

  const urlStats: UrlStat[] = await prisma.url.findMany({
    where: {
      host: {
        is: {
          host: domain as string,
        },
      },
    },
    select: {
      id: true,
      url: true,
      _count: true,
    },
    orderBy: {
      pageViews: { _count: 'desc' },
    },
  })

  return {
    props: { urlStats, domain },
  }
}
