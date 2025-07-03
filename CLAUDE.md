# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that provides pageview tracking analytics. It generates a JavaScript tracking snippet that websites can embed to track page views, with detailed analytics including geolocation, user agent parsing, and visit statistics.

### Core Architecture

- **Frontend**: Next.js React app with Tailwind CSS and Tremor React components for analytics dashboard
- **Backend**: Next.js API routes handling pageview collection and analytics
- **Database**: MySQL with Prisma ORM using relationMode="prisma" for PlanetScale compatibility
- **Tracking**: Client-side JavaScript beacon with cookie-based deduplication

### Key Components

- `middleware.ts`: Handles pageview.js script generation and enriches API requests with geo/UA data
- `pages/api/pageview.ts`: Core API endpoint that processes and stores pageview data
- `pageview.ts`: Contains the client-side tracking script template
- `prisma/schema.prisma`: Database schema with normalized structure for URLs, hosts, user agents, and geo data

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

- **Framework**: Next.js 14.2.5 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui design system
- **UI Components**: shadcn/ui (Card, Button, Badge, Tabs), Lucide React icons
- **Database**: Prisma 6.11.0 + PostgreSQL (Neon database)
- **Deployment**: Vercel with turbo build optimization
- **Package Manager**: Yarn (as evidenced by yarn.lock)

## Development Notes

- Uses `turbo.json` for build optimization
- ESLint configured with Next.js and Prettier integration
- shadcn/ui components with Radix UI primitives for accessibility
- Production deployment requires PostgreSQL database setup (Neon)

## Feature Development Roadmap

### 🎯 High Priority Features (Implement First)

#### 1. Real-time Analytics Dashboard

- **Branch**: `feat/realtime-analytics`
- **Components**: WebSocket integration, live visitor count, real-time charts
- **Dependencies**: `ws`, `recharts`, `socket.io`
- **Implementation**: Add WebSocket server, real-time data streaming, live dashboard updates

#### 2. Interactive Charts & Visualizations

- **Branch**: `feat/interactive-charts`
- **Components**: Time series charts, geographic maps, device breakdowns
- **Dependencies**: `recharts`, `@tremor/react` (charts), date picker
- **Implementation**: shadcn/ui charts, responsive data visualization, filtering

#### 3. Advanced Analytics & Insights

- **Branch**: `feat/advanced-analytics`
- **Components**: Trends analysis, bounce rate, session tracking, referrer analysis
- **Implementation**: Enhanced data collection, analytics calculations, insights dashboard

### 🚀 Medium Priority Features

#### 4. Event Tracking System

- **Branch**: `feat/event-tracking`
- **Components**: Custom event collection, goal tracking, conversion funnels
- **Implementation**: Extend tracking script, new API endpoints, event analytics

#### 5. Multi-Project Dashboard

- **Branch**: `feat/multi-project`
- **Components**: Project switching, consolidated analytics, team management
- **Implementation**: Project model, permissions, multi-tenant architecture

#### 6. Smart Alerts & Notifications

- **Branch**: `feat/alerts-notifications`
- **Components**: Traffic alerts, email reports, notification system
- **Dependencies**: `nodemailer`, notification service integration
- **Implementation**: Alert engine, notification templates, subscription management

### 🔧 Quick Wins & Enhancements

#### 7. Enhanced Data Collection

- **Branch**: `feat/enhanced-tracking`
- **Components**: Referrer tracking, session IDs, scroll depth, time on page
- **Implementation**: Extend pageview.js, additional data points, session management

#### 8. Export & API Enhancements

- **Branch**: `feat/export-api`
- **Components**: CSV export, enhanced API endpoints, data filtering
- **Implementation**: Export utilities, REST API extensions, data serialization

#### 9. Performance Optimizations

- **Branch**: `feat/performance`
- **Components**: Caching, pagination, query optimization, CDN integration
- **Implementation**: Redis caching, database optimization, performance monitoring

### 📱 Future Enhancements

#### 10. Mobile App (Optional)

- **Branch**: `feat/mobile-app`
- **Framework**: React Native or Flutter
- **Components**: Mobile analytics, push notifications, offline support

### Development Workflow

1. **Feature Implementation Process**:
   - Create feature branch from main
   - Implement feature with full test coverage
   - Update CLAUDE.md with implementation details
   - Create PR with comprehensive description
   - Merge after CI passes (no manual review required)

2. **Quality Standards**:
   - TypeScript strict mode compliance
   - shadcn/ui component consistency
   - Responsive design (mobile-first)
   - Accessibility compliance (WCAG 2.1)
   - Performance optimization (Core Web Vitals)

3. **Testing Requirements**:
   - Unit tests for utilities and API endpoints
   - Integration tests for database operations
   - E2E tests for critical user flows
   - Performance testing for analytics queries

4. **Documentation Updates**:
   - Update CLAUDE.md for each merged feature
   - API documentation for new endpoints
   - Component documentation for UI additions
   - Migration guides for breaking changes
