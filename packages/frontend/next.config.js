/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
let nextConfig = {}

const withTwin = require('./withTwin.js')
const isProd = process.env.NODE_ENV === 'production'

nextConfig = withTwin(nextConfig)

module.exports = {
  ...nextConfig,
  ...(isProd && { assetPrefix: '/ink-dApp-directory' }),
  images: {
    unoptimized: true,
  },
}
