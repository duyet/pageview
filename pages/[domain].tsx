import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Card, Flex, Grid, Col, Button } from '@tremor/react'
import { List, ListItem, Badge, Title, AreaChart } from '@tremor/react'
import { ArrowNarrowLeftIcon, ExternalLinkIcon } from '@heroicons/react/solid'

import prisma from '../lib/prisma'

type Count = {
  pageViews: number
}

type UrlStat = {
  url: string
  _count: Count
}

type URLStatsProps = {
  domain: String
  urlStats: UrlStat[]
}

const data = [
  {
    Month: 'Jan 21',
    PageView: 1245,
  },
  {
    Month: 'Feb 21',
    PageView: 2938,
  },
  {
    Month: 'Jul 21',
    PageView: 2345,
  },
]

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
      <List>
        {urlStats.map((row: any) => {
          return (
            <ListItem key={row.url}>
              <Grid numCols={1} numColsSm={4} className="mt-6">
                <Col>
                  <Flex className="space-x-5" alignItems="start">
                    <Link href={row.url} target="_blank">
                      <Button
                        size="sm"
                        variant="light"
                        icon={ExternalLinkIcon}
                        iconPosition="right"
                      >
                        {row.url}
                      </Button>
                    </Link>
                    <Badge>PageView: {row._count.pageViews}</Badge>
                  </Flex>
                </Col>
                <Col numColSpanSm={3}>
                  <AreaChart
                    className="mt-6 ml-0 h-24 md:mt-0 md:ml-6"
                    data={data}
                    index="Month"
                    categories={['PageView']}
                    colors={['blue']}
                    showGridLines={false}
                    showYAxis={false}
                    showLegend={false}
                    showTooltip={true}
                  />
                </Col>
              </Grid>
            </ListItem>
          )
        })}
      </List>
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
      url: true,
      _count: true,
    },
  })

  return {
    props: { urlStats, domain },
  }
}
