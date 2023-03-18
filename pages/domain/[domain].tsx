import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Card, Flex, Grid, Col, Button } from '@tremor/react'
import { List, ListItem, Badge, Title } from '@tremor/react'
import { ArrowNarrowLeftIcon, ExternalLinkIcon } from '@heroicons/react/solid'

import prisma from '../../lib/prisma'

type Count = {
  pageViews: number
}

type UrlStat = {
  id: number
  url: string
  _count: Count
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
      <List>
        {urlStats.map((row: any) => {
          return (
            <ListItem key={row.url}>
              <Grid numCols={1} numColsSm={4} className="mt-6">
                <Col>
                  <div>
                    <Flex className="space-x-5" alignItems="start">
                      <Link href={`/url/${row.id}`}>{row.url}</Link>
                      <Badge>PageView: {row._count.pageViews}</Badge>

                      <Link href={row.url} target="_blank">
                        <Badge>
                          <Button
                            size="sm"
                            variant="light"
                            icon={ExternalLinkIcon}
                            iconPosition="right"
                          >
                            Visit URL
                          </Button>
                        </Badge>
                      </Link>
                    </Flex>
                  </div>
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
      id: true,
      url: true,
      _count: true,
    },
  })

  return {
    props: { urlStats, domain },
  }
}
