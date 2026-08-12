import { getAbsoluteURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /dashboard/',
    'Disallow: /inbox/',
    'Disallow: /me/',
    `Sitemap: ${getAbsoluteURL('/sitemap.xml')}`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
