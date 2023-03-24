import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Card, Text, Grid, Flex, Button } from '@tremor/react'
import { Title, BarList } from '@tremor/react'
import { ArrowNarrowLeftIcon, ExternalLinkIcon } from '@heroicons/react/solid'

import { Prisma, Country, Url, Host, UA } from '@prisma/client'
import prisma from '../../lib/prisma'
import dayjs from '../../lib/dayjs'

type UrlWithHost = Url & {
  host: Host
}

type PageViewStats = Prisma.AggregatePageView & {
  _min: {
    createdAt: string
  }
  _max: {
    createdAt: string
  }
  _count: number
}

type TopCountry = Prisma.PageViewGroupByOutputType &
  Country & {
    _count: number
  }

type TopUA = Prisma.PageViewGroupByOutputType & UA

type TopOS = {
  os: string
  _count: number
}

type TopBrowser = {
  browser: string
  _count: number
}

type TopEngine = {
  engine: string
  _count: number
}

type TopDevice = {
  device: string
  _count: number
}

type Props = {
  url: UrlWithHost
  pageviewStats: PageViewStats
  topCountry: TopCountry[]
  topUA: TopUA[]
  topOS: TopOS[]
  topBrowser: TopBrowser[]
  topEngine: TopEngine[]
  topDevice: TopDevice[]
}

export default function Home({
  url,
  pageviewStats,
  topCountry,
  topOS,
  topBrowser,
  topEngine,
  topDevice,
}: Props) {
  return (
    <>
      <Card>
        <Title>
          <Link href={`/domain/${url.host.host}`}>
            <Button
              size="sm"
              variant="light"
              icon={ArrowNarrowLeftIcon}
              iconPosition="left"
            >
              {url.host.host}
            </Button>
          </Link>
        </Title>

        <a href={url.url} target="_blank">
          <Button
            size="sm"
            variant="light"
            icon={ExternalLinkIcon}
            iconPosition="right"
          >
            {url.url}
          </Button>
        </a>

        <Flex justifyContent="between" className="mt-3">
          <div>
            <Title title={pageviewStats._min?.createdAt}>
              {dayjs(pageviewStats._min?.createdAt).fromNow()}
            </Title>
            <Text>First Seen</Text>
          </div>
          <div className="text-center">
            <Title>{pageviewStats._count}</Title>
            <Text>Total</Text>
          </div>
          <div className="text-right">
            <Title title={pageviewStats._max?.createdAt}>
              {dayjs(pageviewStats._max?.createdAt).fromNow()}
            </Title>
            <Text className="text-right">Last Seen</Text>
          </div>
        </Flex>
      </Card>

      <Grid numColsMd={2} className="mt-6 gap-6">
        <Card>
          <Title>Top OS</Title>
          {!topOS.length && <Text>N/A</Text>}
          <BarList
            className="mt-6"
            data={topOS.map((row: TopOS) => ({
              name: row.os as unknown as string,
              value: row._count,
            }))}
          />
        </Card>

        <Card>
          <Title>Top Browser</Title>
          {!topBrowser.length && <Text>N/A</Text>}
          <BarList
            className="mt-6"
            data={topBrowser.map((row: TopBrowser) => ({
              name: row.browser,
              value: row._count,
            }))}
          />
        </Card>

        <Card>
          <Title>Top Engine</Title>
          {!topEngine.length && <Text>N/A</Text>}
          <BarList
            className="mt-6"
            data={topEngine.map((row: TopEngine) => ({
              name: row.engine,
              value: row._count,
            }))}
          />
        </Card>

        <Card>
          <Title>Top Device</Title>
          {!topDevice.length && <Text>N/A</Text>}
          <BarList
            className="mt-6"
            data={topDevice.map((row: TopDevice) => ({
              name: row.device,
              value: row._count,
            }))}
          />
        </Card>

        <Card>
          <Title>Top Country</Title>
          {!topCountry.length && <Text>N/A</Text>}
          <BarList
            className="mt-6"
            data={topCountry.map((row: TopCountry) => ({
              name: row.country || 'N/A',
              value: row._count,
            }))}
          />
        </Card>
      </Grid>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { urlId } = query
  const id = parseInt(urlId as string)

  const url = await prisma.url.findUnique({
    where: {
      id,
    },
    include: {
      host: true,
    },
  })

  console.log('url', url)

  const topCountryId = await prisma.pageView.groupBy({
    by: ['countryId'],
    _count: true,
    where: {
      urlId: id,
      countryId: {
        not: null,
      },
    },
  })
  console.log('topCountryId', topCountryId)

  // Pageview stats (first seen, last seen, total, ...)
  const pageviewStats = await prisma.pageView.aggregate({
    where: {
      urlId: id,
    },
    _count: true,
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
  })
  console.log('pageviewStats', pageviewStats)

  // TODO: low performance
  const topCountry = await Promise.all(
    topCountryId
      .sort((a: any, b: any) => b._count - a._count)
      .map(async (row: any) => {
        const country = await prisma.country.findUnique({
          where: {
            id: row.countryId as unknown as number,
          },
        })

        return {
          ...row,
          ...country,
        }
      })
  )
  console.log('topCountry', topCountry)

  const topUAId = await prisma.pageView.groupBy({
    by: ['uAId'],
    _count: true,
    where: {
      urlId: id,
      uAId: {
        not: null,
      },
    },
  })
  console.log('topUAId', topUAId)

  const topUA = await Promise.all(
    topUAId.map(async (row: any) => {
      const ua = await prisma.uA.findUnique({
        where: {
          id: row.uAId as unknown as number,
        },
      })

      return {
        ...row,
        ...ua,
      }
    })
  )
  console.log('topUA', topUA)

  // Top OS
  const topOS = groupByFromUA(topUA, 'os')
  console.log('topOS', topOS)

  // Top Browser
  const topBrowser = groupByFromUA(topUA, 'browser')
  console.log('topBrowser', topBrowser)

  // Top Browser Engine
  const topEngine = groupByFromUA(topUA, 'engine')
  console.log('topEngine', topEngine)

  // Top Device
  const topDevice = groupByFromUA(topUA, 'device')
  console.log('topDevice', topDevice)

  return {
    props: {
      url: JSON.parse(JSON.stringify(url)),
      pageviewStats: JSON.parse(JSON.stringify(pageviewStats)),
      topCountry,
      topUA,
      topOS,
      topBrowser,
      topEngine,
      topDevice,
    },
  }
}

function groupByFromUA(array: any[], key: string) {
  return array
    .reduce((acc: any, row: any) => {
      // Attention: this is not a deep search. Harded coded to row.ua.<key>
      const keyValue = row[key] || 'N/A'
      const count = row._count

      const index = acc.findIndex((row: any) => row[key] === keyValue)
      if (index === -1) {
        acc.push({ [key]: keyValue, _count: count })
      } else {
        acc[index]._count += count
      }

      return acc
    }, [])
    .sort((a: any, b: any) => b._count - a._count)
}
