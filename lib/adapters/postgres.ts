import prisma from '../prisma'
import { PageViewAdapter, PageViewEvent } from './types'

export class PostgresAdapter implements PageViewAdapter {
  name = 'Postgres'
  enabled = process.env.ENABLE_POSTGRES !== 'false'

  async initialize(): Promise<void> {
    // Prisma manages DB schema initialization automatically
    if (this.enabled) {
      console.log('Postgres/Prisma adapter initialized.')
    }
  }

  async broadcast(event: PageViewEvent): Promise<void> {
    if (!this.enabled) return

    const hostName = event.host
    const pathName = event.path
    const uaString = event.ua || 'Unknown'
    const countryName = event.country || 'Unknown'
    const cityName = event.city || 'Unknown'

    // Use transaction to write normalized relational models & PageView event
    await prisma.$transaction(async (tx) => {
      // Upsert normalizations
      const [host, slug, ua, country, city] = await Promise.all([
        tx.host.upsert({
          where: { host: hostName },
          update: {},
          create: { host: hostName },
        }),
        tx.slug.upsert({
          where: { slug: pathName },
          update: {},
          create: { slug: pathName },
        }),
        tx.uA.upsert({
          where: { ua: uaString },
          update: {},
          create: {
            ua: uaString,
            browser: event.browser || null,
            browserVersion: event.browserVersion || null,
            os: event.os || null,
            osVersion: event.osVersion || null,
            engine: event.engine || null,
            engineVersion: event.engineVersion || null,
            device: event.device || null,
            deviceModel: event.deviceModel || null,
            deviceType: event.deviceType || null,
            isBot: event.isBot || false,
            botType: event.botType || null,
            botName: event.botName || null,
          },
        }),
        tx.country.upsert({
          where: { country: countryName },
          update: {},
          create: { country: countryName },
        }),
        tx.city.upsert({
          where: { city: cityName },
          update: {},
          create: { city: cityName },
        }),
      ])

      // Upsert the Url record
      const urlRecord = await tx.url.upsert({
        where: { url: event.url },
        update: {},
        create: {
          url: event.url,
          hostId: host.id,
          slugId: slug.id,
        },
      })

      // Create the PageView record with all normalized foreign keys and enriched fields
      await tx.pageView.create({
        data: {
          urlId: urlRecord.id,
          uAId: ua.id,
          ip: event.ip || null,
          countryId: country.id,
          cityId: city.id,

          // Enrichment fields
          title: event.title || null,
          referrer: event.referrer || null,
          region: event.region || null,
          latitude: event.latitude || null,
          longitude: event.longitude || null,
          screenWidth: event.screenWidth || null,
          screenHeight: event.screenHeight || null,
          language: event.language || null,
          sessionId: event.sessionId || null,
          utmSource: event.utmSource || null,
          utmMedium: event.utmMedium || null,
          utmCampaign: event.utmCampaign || null,
          utmTerm: event.utmTerm || null,
          utmContent: event.utmContent || null,

          createdAt: event.timestamp,
        },
      })
    })
  }
}
