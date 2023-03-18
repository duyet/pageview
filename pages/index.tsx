import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Card, Flex, Grid } from '@tremor/react'
import { List, ListItem, Text, Bold, Metric, Button } from '@tremor/react'
import { ArrowNarrowRightIcon } from '@heroicons/react/solid'

import { Host } from '@prisma/client'

import prisma from '../lib/prisma'
import { Usage } from '../components/Usage'

type Props = {
  domainStats: Host[]
  hosts: Record<string, string>
  currentHost: string
  totalPageViews: number
  totalUrls: number
}

export default function Home({
  domainStats,
  hosts,
  currentHost,
  totalPageViews,
  totalUrls,
}: Props) {
  return (
    <>
      <Grid numColsMd={2} numColsLg={3} className="mt-6 gap-6">
        <Card>
          <Text>Total Pageview</Text>
          <Metric>{totalPageViews}</Metric>
        </Card>
        <Card>
          <Flex alignItems="start">
            <Text>Domain</Text>
          </Flex>
          <Metric>{Object.keys(hosts).length}</Metric>
        </Card>
        <Card>
          <Text>URL</Text>
          <Metric>{totalUrls}</Metric>
        </Card>
      </Grid>

      <Card className="mt-6">
        <Text>API Usage</Text>
        <pre className="truncate">
          GET https://{currentHost}/api/pageview?url=&lt;url&gt;
        </pre>
      </Card>

      <Card className="mt-6">
        <Usage currentHost={currentHost} />
      </Card>

      <Card className="mt-6">
        <List>
          {domainStats.map((row: any) => {
            const hostName = hosts[row.hostId]

            return (
              <Link href={`/domain/` + hostName} key={row.hostId}>
                <ListItem key={row.hostId} className="mb-4">
                  <Flex justifyContent="start" className="space-x-4 truncate">
                    <img
                      src={`https://www.google.com/s2/favicons?sz=256&domain=${hostName}`}
                      alt={hostName}
                      className="mr-2 h-6 w-6"
                    />

                    <div>
                      <Text className="truncate">
                        <Button
                          size="sm"
                          variant="light"
                          icon={ArrowNarrowRightIcon}
                          iconPosition="right"
                        >
                          <Bold>{hostName}</Bold>
                        </Button>
                      </Text>
                      <Text>URLs: {row._count}</Text>
                    </div>
                  </Flex>
                </ListItem>
              </Link>
            )
          })}
        </List>
      </Card>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const currentHost = req.headers.host as string

  const domainStats = await prisma.url.groupBy({
    by: ['hostId'],
    _count: true,
  })

  const hosts: Props['hosts'] = {}
  const _ = (await prisma.host.findMany()).forEach((row) => {
    hosts[row.id] = row.host
  })

  const totalPageViews = await prisma.pageView.count()

  const totalUrls = await prisma.url.count()

  return {
    props: { domainStats, hosts, currentHost, totalPageViews, totalUrls },
  }
}
