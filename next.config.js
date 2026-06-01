/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blog.duyet.net',
      },
    ],
  },
  serverExternalPackages: ['duckdb'],
  turbopack: {},
}

module.exports = nextConfig
