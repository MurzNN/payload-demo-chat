import { withPayload } from '@payloadcms/next/withPayload'
import { withNextWs } from 'next-ws/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  serverExternalPackages: ['awilix-manager'],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

// Apply both PayloadCMS and WebSocket plugins
export default withNextWs(withPayload(nextConfig, { devBundleServerPackages: false }))
