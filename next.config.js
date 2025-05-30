/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ITHY_SESSION_COOKIE: process.env.ITHY_SESSION_COOKIE,
    ITHY_INTERCOM_COOKIE: process.env.ITHY_INTERCOM_COOKIE,
  },
  output: 'standalone',
  experimental: {
    // Remove deprecated appDir option
  }
}

module.exports = nextConfig 