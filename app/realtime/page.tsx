import type { Metadata } from 'next';

import { RealtimeClient } from './realtime-client';

export const metadata: Metadata = {
  title: 'Real-time Analytics - PageView',
  description:
    'Live monitoring dashboard showing real-time pageviews, active visitors, and traffic sources. Track your website activity as it happens with 30-second updates and WebSocket connectivity.',
};

export default function RealtimePage() {
  return <RealtimeClient />;
}
