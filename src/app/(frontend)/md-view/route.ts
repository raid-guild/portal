import configPromise from '@payload-config'
import { getPayload, type CollectionSlug } from 'payload'
import { headers } from 'next/headers'

import { adapters, type MarkdownRouteKey } from './adapters'
import { escape, joinSections } from './lib/markdownPrimitives'
import { publicWhere, response } from './lib/response'

export const dynamic = 'force-dynamic'

export async function GET() {
  const path = (await headers()).get('x-portal-markdown-path') || ''
  const parts = path.split('/').filter(Boolean)

  if (path === '/') {
    return response(
      '# RaidGuild Portal\n\nA community portal for current activity, projects, events, threads, and reviewed knowledge.\n\n- [Public content map](/llms.txt)\n- [Posts](/posts)\n- [Projects](/projects)\n- [Events](/events)\n- [Wiki](/wiki)',
    )
  }

  const key = parts[0] as MarkdownRouteKey
  const adapter = adapters[key]
  if (!adapter || parts.length > 2) return response('# Not found', 404)

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: adapter.collection as CollectionSlug,
    draft: false,
    limit: parts[1] ? 1 : 50,
    overrideAccess: false,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        ...(publicWhere(parts[1] ? adapter.key : undefined, parts[1]).and || []),
        ...(adapter.extraWhere?.(parts) ? [adapter.extraWhere(parts) as NonNullable<unknown>] : []),
      ],
    },
  })
  const docs = result.docs as unknown as Array<
    Record<string, unknown> & { id: number; title?: string }
  >

  if (parts[1]) {
    const doc = docs[0]
    if (!doc) return response('# Not found', 404)

    const sections = adapter.renderDetail(doc as never)
    const body = joinSections(sections)

    return response(
      [`# ${escape(doc.title || 'Untitled')}`, body ? `\n${body}` : '', `\nCanonical: ${path}`].join(
        '\n',
      ),
    )
  }

  const title = key === 'wiki' ? 'Reviewed Wiki Pages' : `${key[0].toUpperCase()}${key.slice(1)}`
  const items = docs.map((doc) => {
    const idOrSlug = adapter.key === 'id' ? doc.id : (doc.slug as string | number | undefined)
    const summary = adapter.listSummary?.(doc as never) ?? (doc.summary as string | undefined)
    const suffix = summary ? ` - ${escape(summary)}` : ''
    return `- [${escape((doc.title as string) || 'Untitled')}](/${key}/${idOrSlug})${suffix}`
  })

  return response([`# ${title}`, '', ...items].join('\n'))
}
