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
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Tremor React, Heroicons
- **Database**: Prisma + MySQL (PlanetScale)
- **Deployment**: Vercel with turbo build optimization
- **Package Manager**: Yarn (as evidenced by yarn.lock)

## Development Notes

- Uses `turbo.json` for build optimization
- ESLint configured with Next.js and Prettier integration
- Tailwind plugin for enhanced UI components
- Production deployment requires database setup (see README for PlanetScale instructions)
