import { getPayload } from 'payload'
import config from '@payload-config'
import { publicModuleCard } from '@/utilities/publicModuleCatalog'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const page = Number(new URL(request.url).searchParams.get('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) {
    return Response.json({ error: 'Invalid page' }, { status: 400 })
  }
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'modules',
      // The collection otherwise requires login. This narrowly scoped public
      // projection deliberately bypasses it; the predicate is not caller supplied.
      overrideAccess: true,
      where: { and: [{ enabled: { equals: true } }, { visibility: { equals: 'public' } }] },
      select: { slug: true, name: true, summary: true, category: true, thumbnail: true, enabled: true, visibility: true, entryRoute: true, authMode: true },
      depth: 1,
      limit: 100,
      page,
      sort: ['sortOrder', 'id'],
    })
    return Response.json({ docs: result.docs.map(publicModuleCard).filter(Boolean), nextPage: result.nextPage, totalDocs: result.totalDocs }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300', 'Access-Control-Allow-Origin': '*' },
    })
  } catch {
    return Response.json({ error: 'Catalog temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
