# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that provides pageview tracking analytics. It generates a JavaScript tracking snippet that websites can embed to track page views, with detailed analytics including geolocation, user agent parsing, visit statistics, and real-time monitoring.

### Core Architecture

- **Frontend**: Next.js Pages Router with Tailwind CSS and shadcn/ui components
- **Backend**: Next.js API routes handling pageview collection, analytics, and WebSocket connections
- **Database**: PostgreSQL (Neon) with Prisma ORM using native foreign key constraints
- **Tracking**: Client-side JavaScript beacon with cookie-based deduplication (10-minute timeout)
- **Real-time**: Socket.io for live analytics updates

### Key Components

- `middleware.ts`: Generates pageview.js script dynamically and enriches all /api/* requests with geo/UA data from Vercel Edge
- `pages/api/pageview.ts`: Core tracking endpoint accepting URLs via body, query params, or referer header
- `pages/api/socket.ts`: WebSocket server for real-time analytics updates
- `pages/api/analytics/`: Analytics endpoints for trends, devices, and locations
- `pages/api/realtime/metrics.ts`: Real-time metrics endpoint (last 24h, 30s cache)
- `pageview.ts`: Client-side tracking script template with beacon API and cookie deduplication
- `prisma/schema.prisma`: Normalized database schema with comprehensive indexing
- `pages/index.tsx`: Homepage with domain overview and integration instructions
- `pages/analytics.tsx`: Advanced analytics dashboard with date range filtering
- `pages/realtime.tsx`: Real-time monitoring dashboard with WebSocket integration
- `hooks/useRealtimeMetrics.ts`: Custom hook for polling real-time metrics
- `hooks/useSocket.ts`: Custom hook for Socket.io connection management
- `components/charts/`: Recharts-based visualization components (Trends, Device, Location, Realtime)

## Development Commands

```bash
# Start development server (includes Prisma generation)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Database operations
yarn prisma:generate
# For deployment (Vercel)
yarn vercel-build

# Code quality
yarn lint
yarn fmt  # Prettier formatting
```

## Database Management

The project uses Prisma with PostgreSQL (Neon database). Database schema is normalized with separate models for:

- PageView: Main analytics record
- Url/Host/Slug: Normalized URL components
- UA: User agent parsing results
- Country/City: Geolocation data

Key considerations:

- Uses native PostgreSQL foreign key constraints for data integrity
- Comprehensive indexing strategy for optimal query performance
- `connectOrCreate` pattern used extensively to handle normalization
- Migration files in `prisma/migrations/`

## API Architecture

- `/api/pageview`: Main tracking endpoint that accepts URL via body, query params, or referer header
- `/pageview.js`: Dynamically generated tracking script via middleware
- Middleware enriches requests with parsed user agent and geo data from Vercel Edge

## Client-Side Tracking

The tracking script (`pageview.ts`) implements:

- Cookie-based deduplication with 10-minute timeout
- Beacon API for reliable data transmission
- Event listeners for visibility changes, navigation, and DOM load
- Hash-based cookie naming for URL-specific tracking

## Tech Stack

- **Framework**: Next.js 14.2.32 with TypeScript 5.9.2, Pages Router
- **Styling**: Tailwind CSS 3.4.17 with shadcn/ui design system
- **UI Components**: shadcn/ui (Card, Button, Badge, Tabs, Table, Calendar), Lucide React icons, Radix UI primitives
- **Charts**: Recharts 3.0.2 for data visualization
- **Database**: Prisma 6.11.0 + PostgreSQL (Neon database)
- **Real-time**: Socket.io 4.8.1 (server + client)
- **Utilities**: date-fns 4.1.0, dayjs 1.11.13, normalize-url 8.0.2
- **Deployment**: Vercel with turbo 1.13.4 build optimization
- **Package Manager**: Yarn

## Project Structure

```
pages/
├── _app.tsx              # App wrapper with Header component
├── index.tsx             # Homepage: domain list & usage stats
├── analytics.tsx         # Analytics dashboard with date range
├── realtime.tsx          # Real-time monitoring dashboard
├── domain/[domain].tsx   # Per-domain analytics
├── url/[urlId].tsx       # Per-URL detailed analytics
└── api/
    ├── pageview.ts       # Main tracking endpoint
    ├── health.ts         # Health check endpoint
    ├── socket.ts         # WebSocket server
    ├── analytics/        # Analytics API endpoints
    │   ├── trends.ts
    │   ├── devices.ts
    │   └── locations.ts
    └── realtime/
        └── metrics.ts    # Real-time metrics endpoint

components/
├── ui/                   # shadcn/ui components
├── charts/               # Chart components (Recharts)
├── Header.tsx            # Navigation header
├── Usage.tsx             # Usage instructions component
├── DateRangePicker.tsx   # Date range selector
├── RealtimeMetricCard.tsx
└── RealtimeTable.tsx

lib/
├── prisma.ts             # Prisma client singleton
├── dayjs.ts              # Day.js configuration
└── utils.ts              # Utility functions (cn, etc.)

hooks/
├── useRealtimeMetrics.ts # Real-time metrics polling
└── useSocket.ts          # Socket.io connection

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## Development Notes

- Uses `turbo.json` for Vercel build optimization
- ESLint configured with Next.js, Prettier, and Tailwind CSS plugin
- shadcn/ui components configuration in `components.json`
- Custom hooks for real-time data and WebSocket management
- Middleware runs on Vercel Edge for geo/UA enrichment
- Production deployment requires:
  - PostgreSQL database (Neon recommended)
  - `DATABASE_URL` environment variable
  - Vercel deployment for Edge middleware features

## Implementation Notes

### Data Flow Architecture

**Tracking Flow**:
1. Website includes `<script src="https://pageview.duyet.net/pageview.js">`
2. Middleware generates script on-the-fly from `pageview.ts` template
3. Script uses Beacon API to send pageview to `/api/pageview?url=...`
4. Middleware enriches request with geo/UA data before reaching API route
5. API route normalizes URL (removes UTM params) and uses `connectOrCreate` pattern
6. PageView record created with foreign keys to normalized entities

**Analytics Flow**:
- Homepage (`/`): Aggregates by domain, shows total stats
- Domain page (`/domain/[domain]`): Shows all URLs for a domain
- URL page (`/url/[urlId]`): Detailed analytics for specific URL
- Analytics page (`/analytics`): Advanced charts with date range filtering
- Realtime page (`/realtime`): Live metrics with WebSocket updates

### Database Patterns

The schema uses aggressive normalization to reduce redundancy:
- URLs decomposed into Host + Slug
- User agents deduplicated by full UA string
- Geo data normalized at Country and City level
- All foreign keys use native PostgreSQL constraints (not `relationMode="prisma"`)
- Extensive indexing on foreign keys, timestamps, and lookup fields

**Query Pattern**: Use `connectOrCreate` extensively in `pages/api/pageview.ts` to handle normalization atomically.

### Real-time Architecture

- Socket.io server in `pages/api/socket.ts` (Next.js API route)
- Client connects via `useSocket()` hook
- Metrics polled every 30s via `useRealtimeMetrics()` hook
- Real-time metrics API (`/api/realtime/metrics.ts`) queries last 24h with caching

### Middleware Behavior

Middleware (`middleware.ts`) intercepts:
1. `/pageview.js` → generates tracking script dynamically
2. `/api/*` → enriches with Vercel Edge geo/UA data via query params

**Important**: Middleware must `rewrite(url)` not `redirect()` to preserve query params.
