import { getSitemapShardIDs } from '../../../sitemap-shards'
import sitemap from '../../sitemap-data'

export const dynamic = 'force-static'
export const revalidate = 3600

// Build without querying CMS tables: Railway migrates only after the image is built.
// Unknown shards are generated and cached on their first request.
export function generateStaticParams() {
  return []
}

const escapeXML = (value: string) =>
  value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return entities[character]
  })

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-z-]+-\d+\.xml$/.test(id)) return new Response('Not Found', { status: 404 })
  const shardID = id.slice(0, -4)
  const shards = await getSitemapShardIDs()
  if (!shards.some((shard) => shard.id === shardID)) {
    return new Response('Not Found', { status: 404 })
  }
  const entries = await sitemap({ id: Promise.resolve(shardID) })
  const urls = entries
    .map(({ url, lastModified }) => {
      const modified = lastModified instanceof Date ? lastModified.toISOString() : lastModified
      return `<url><loc>${escapeXML(url)}</loc>${modified ? `<lastmod>${escapeXML(modified)}</lastmod>` : ''}</url>`
    })
    .join('\n')
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  )
}
