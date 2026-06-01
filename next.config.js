/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['blog.duyet.net'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // duckdb is an optional native binary — exclude from webpack bundle.
      // The MotherDuck adapter wraps require('duckdb') in a try/catch and
      // falls back to JSONL buffer mode when the native module is absent.
      config.externals.push('duckdb')
    }
    return config
  },
}

module.exports = nextConfig
