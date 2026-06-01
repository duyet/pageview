# Pageview Analytics

![](https://api.checklyhq.com/v1/badges/checks/7da0b0e8-698c-4264-86b5-4b45a139c37e?style=flat&theme=dark)

**Simple analytics, powerful insights** - Privacy-focused pageview tracking with multiple integration options.

Modern analytics without the tracking baggage. Track pageviews without tracking users. Minimal cookies (10-min deduplication only), no user profiling, maximum transparency.

✨ **Features**

- 🚀 Fast & lightweight tracking script
- 🔒 Privacy-first (no user profiling or persistent cookies)
- ⚡ Real-time monitoring with WebSocket updates
- 📊 Advanced analytics dashboard
- 🔌 Multiple integration options: Script embed, REST API, or backend push
- 🌍 Geo-location and device insights
- 📱 Responsive design with dark mode
- 🔓 Open source and transparent

![](https://screenshotter.vercel.app/screenshot?url=https://pageview.duyet.net&viewport=1728,1117)
![](https://screenshotter.vercel.app/screenshot?url=https://pageview.duyet.net/url/2&viewport=1728,1117)

## How It Works

This project provides high-performance, privacy-focused pageview analytics through an optimized three-tier process:

```mermaid
flowchart TD
    classDef client fill:#e0f7fa,stroke:#00acc1,stroke-width:2px,color:#000;
    classDef edge fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#000;
    classDef api fill:#efebe9,stroke:#5d4037,stroke-width:2px,color:#000;
    classDef db fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;

    subgraph Client ["Client Browser"]
        A[Load Page / Route Change] --> B{10-Min Cookie Dedup?}
        B -- Yes --> C[Skip Pageview]
        B -- No --> D[Send Beacon Ping + Rich Telemetry]
    end

    subgraph Edge ["Vercel Edge Middleware"]
        D --> E[Parse Geolocation & User-Agent]
        E --> F[Run Enhanced Bot Detection]
    end

    subgraph Backend ["Next.js Backend API"]
        F --> G[Normalize URL & Strip UTMs]
        G --> H[Adapter Hub - Parallel Broadcast]
    end

    subgraph Adapters ["Active Storage Backends"]
        H --> I[Postgres via Prisma]
        H --> J[ClickHouse HTTP URL]
        H --> K[MotherDuck / DuckDB]
        H --> L[Secure HTTP Webhook]
    end

    class A,B,C,D client;
    class E,F edge;
    class G,H api;
    class I,J,K,L db;
```

1. **Lightweight Client-side Tracking (`pageview.js`):** Client websites load a dynamically generated tracking script. To keep it privacy-first, the script uses a temporary (10-minute) cookie to deduplicate pageviews, and transmits data using the non-blocking `navigator.sendBeacon` API. It collects rich telemetry, including page titles, referrer URLs, viewport dimensions, user locale, and a session ID (`sessionStorage` backed). It also hooks into modern SPA routing (`history.pushState` / `popstate`).
2. **Edge-level Enrichment (`middleware.ts`):** Requests are intercepted at the Vercel Edge. The middleware enriches request metrics with client geolocation data (country, city, region, latitude, longitude) and parses browser/device capabilities, plus applies robust bot detection before passing the data to the API.
3. **Plug-and-Play Multi-Database Broadcasting (`/api/pageview`):** The API normalizes incoming URLs (stripping promotional UTM tags). It converts the payload into a unified `PageViewEvent` and broadcasts it concurrently to all active database and streaming adapters in parallel using `Promise.allSettled` to make sure slow/offline downstream pipelines never block or fail the primary request.

## Multi-Database Broadcast System

Easily configure pageview events to broadcast to multiple databases or endpoints. Each adapter is completely self-configuring and "plug-and-play" — simply define the corresponding environment variable to activate it.

### Configuration Variables

Define these variables in your `.env` file to enable adapters:

| Environment Variable | Description                                                                                                                                      | Example Value                                                 |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| `ENABLE_POSTGRES`    | Toggles PostgreSQL storage via Prisma. Enabled by default (`true`).                                                                              | `false` (to disable)                                          |
| `CLICKHOUSE_URL`     | Activates ClickHouse HTTP URL broadcasting. Supports authentication, custom databases, and table queries.                                        | `http://user:password@localhost:8123/default?table=pageviews` |
| `MOTHERDUCK_TOKEN`   | Enables MotherDuck serverless DuckDB cloud integration. Falls back to a local JSONL development buffer if DuckDB C++ bindings are not installed. | `md_token_xyz`                                                |
| `WEBHOOK_URL`        | Triggers POST requests forwarding the JSON event to external endpoints.                                                                          | `https://api.myproject.com/v1/webhooks/pageviews`             |
| `WEBHOOK_SECRET`     | Generates a SHA-256 HMAC payload signature sent in the `X-Webhook-Signature` header for secure verification.                                     | `my-webhook-secret-signing-key`                               |

---

### Database Tables DDL Setup

#### 1. ClickHouse

Run this SQL to create the tracking table in ClickHouse:

```sql
CREATE TABLE IF NOT EXISTS default.pageviews (
    id String,
    sessionId Nullable(String),
    url String,
    host LowCardinality(String),
    path String,
    title Nullable(String),
    referrer Nullable(String),
    timestamp DateTime64(3),
    ua Nullable(String),
    browser LowCardinality(Nullable(String)),
    browserVersion LowCardinality(Nullable(String)),
    os LowCardinality(Nullable(String)),
    osVersion LowCardinality(Nullable(String)),
    engine LowCardinality(Nullable(String)),
    engineVersion LowCardinality(Nullable(String)),
    device LowCardinality(Nullable(String)),
    deviceModel Nullable(String),
    deviceType LowCardinality(Nullable(String)),
    isBot UInt8,
    botType LowCardinality(Nullable(String)),
    botName LowCardinality(Nullable(String)),
    ip Nullable(String),
    country LowCardinality(Nullable(String)),
    city LowCardinality(Nullable(String)),
    region LowCardinality(Nullable(String)),
    latitude Nullable(Float64),
    longitude Nullable(Float64),
    screenWidth Nullable(Int32),
    screenHeight Nullable(Int32),
    language LowCardinality(Nullable(String)),
    utmSource LowCardinality(Nullable(String)),
    utmMedium LowCardinality(Nullable(String)),
    utmCampaign LowCardinality(Nullable(String)),
    utmTerm LowCardinality(Nullable(String)),
    utmContent LowCardinality(Nullable(String))
) ENGINE = MergeTree()
ORDER BY (host, timestamp, id);
```

#### 2. MotherDuck / DuckDB

Run this SQL inside DuckDB:

```sql
CREATE TABLE IF NOT EXISTS pageviews (
    id VARCHAR,
    sessionId VARCHAR,
    url VARCHAR,
    host VARCHAR,
    path VARCHAR,
    title VARCHAR,
    referrer VARCHAR,
    timestamp TIMESTAMP,
    ua VARCHAR,
    browser VARCHAR,
    browserVersion VARCHAR,
    os VARCHAR,
    osVersion VARCHAR,
    engine VARCHAR,
    engineVersion VARCHAR,
    device VARCHAR,
    deviceModel VARCHAR,
    deviceType VARCHAR,
    isBot BOOLEAN,
    botType VARCHAR,
    botName VARCHAR,
    ip VARCHAR,
    country VARCHAR,
    city VARCHAR,
    region VARCHAR,
    latitude DOUBLE,
    longitude DOUBLE,
    screenWidth INTEGER,
    screenHeight INTEGER,
    language VARCHAR,
    utmSource VARCHAR,
    utmMedium VARCHAR,
    utmCampaign VARCHAR,
    utmTerm VARCHAR,
    utmContent VARCHAR
);
```

## Quick Start

Add this snippet to your website:

```html
<script>
  !(function (e, n, t) {
    e.onload = function () {
      let e = n.createElement('script')
      ;((e.src = t), n.body.appendChild(e))
    }
  })(window, document, 'https://pageview.duyet.net/pageview.js')
</script>
```

Checkout result at: https://pageview.duyet.net

## Development

To run the development server, execute the following command:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contribute and deployment

To contribute to the project, push any changes to the `dev` branch and create a PR to merge the changes into the `main` branch.
Preview deployment can be seen on the `dev` branch.

For deployment on Vercel, follow these links for instructions:

- https://www.prisma.io/docs/guides/database/using-prisma-with-planetscale
- [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Project note

Disclaimer: This project is not intended for scale and is for personal usage only.
I may consider scaling it later on.
The main purpose of this project is to demonstrate how to use Next.js,
PlanetScale, TurboRepo, Vercel and some modern React components.

## License

MIT.
