import { NextResponse } from 'next/server'

import { PORTAL_CANONICAL_ORIGIN } from '../(frontend)/sitemap-config'
import { getSitemapShardIDs } from '../(frontend)/sitemap-shards'

export const dynamic = 'force-dynamic'

const approvedAgents = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Google-Extended',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'CCBot',
  'Amazonbot',
  'Bytespider',
  'Applebot-Extended',
  'cohere-ai',
]

const privatePaths = [
  '/admin/',
  '/api/',
  '/dashboard/',
  '/forgot-password',
  '/inbox/',
  '/login',
  '/me/',
  '/newsletter/',
  '/next/',
  '/requests/new',
  '/reset-password',
  '/search',
]

export async function GET() {
  const shards = await getSitemapShardIDs()
  const wildcard = ['User-agent: *', 'Allow: /', ...privatePaths.map((path) => `Disallow: ${path}`)]
  const agents = approvedAgents.flatMap((agent) => [
    '',
    `User-agent: ${agent}`,
    'Allow: /',
    ...privatePaths.map((path) => `Disallow: ${path}`),
  ])
  const sitemaps = [
    `${PORTAL_CANONICAL_ORIGIN}/sitemap.xml`,
    ...shards.map(({ id }) => `${PORTAL_CANONICAL_ORIGIN}/sitemaps/sitemap/${id}.xml`),
  ]

  const body = [
    ...wildcard,
    ...agents,
    '',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    `Host: ${PORTAL_CANONICAL_ORIGIN}`,
    ...sitemaps.map((url) => `Sitemap: ${url}`),
    '',
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
