import type { Metadata } from 'next'

import { AnalyticsClient } from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytics - PageView',
  description:
    'Advanced analytics dashboard with traffic trends, device breakdowns, and location insights. Track pageviews, unique visitors, and audience demographics with privacy-first analytics.',
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
