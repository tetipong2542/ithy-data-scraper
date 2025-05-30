/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    ITHY_SESSION_COOKIE: process.env.ITHY_SESSION_COOKIE,
    ITHY_INTERCOM_COOKIE: process.env.ITHY_INTERCOM_COOKIE,
  }
}

module.exports = nextConfig 