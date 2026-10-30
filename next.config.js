import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)).*)',
        headers: [
          {
            key: 'Link',
            value: '</llms.txt>; rel="service-doc", </sitemap.xml>; rel="sitemap"',
          },
        ],
      },
    ]
  },
  images: {
    localPatterns: [
      { pathname: '**', search: '' },
      // Payload's S3 adapter appends this exact namespace query to media URLs.
      { pathname: '/api/media/file/**', search: '?prefix=portal%2Fmedia' },
    ],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'node_modules')],
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig)
