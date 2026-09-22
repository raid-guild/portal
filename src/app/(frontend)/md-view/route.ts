import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type MarkdownDocument = {
  content?: { root?: { children?: unknown[] } } | null
  id: number | string
  slug?: string | null
  summary?: string | null
  title?: string | null
  updatedAt?: string | null
}

type LexicalNode = { children?: LexicalNode[]; text?: string }

const listCollections = {
  cohorts: { collection: 'cohorts', key: 'slug' },
  events: { collection: 'events', key: 'id' },
  posts: { collection: 'posts', key: 'slug' },
  projects: { collection: 'projects', key: 'slug' },
  threads: { collection: 'threads', key: 'slug' },
  wiki: { collection: 'wikiPages', key: 'slug' },
} as const

const text = (nodes: unknown[] | undefined): string[] =>
  nodes?.flatMap((node) => {
    if (!node || typeof node !== 'object') return []
    const lexical = node as LexicalNode
    return [typeof lexical.text === 'string' ? lexical.text : '', ...text(lexical.children)].filter(
      Boolean,
    )
  }) ?? []

const clean = (value: string): string => value.replace(/\s+/g, ' ').trim()
const escape = (value: string): string => clean(value).replace(/([\\[\]()*_`#|])/g, '\\$1')

const response = (markdown: string, status = 200) =>
  new NextResponse(`${markdown.trim()}\n`, {
    status,
    headers: {
      'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store',
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  })

const publicWhere = (field?: string, value?: string): Where => ({
  and: [
    { _status: { equals: 'published' } },
    { visibility: { equals: 'public' } },
    ...(field && value ? [{ [field]: { equals: value } }] : []),
  ],
})

export async function GET() {
  const path = (await headers()).get('x-portal-markdown-path') || ''
  const parts = path.split('/').filter(Boolean)

  if (path === '/') {
    return response(
      '# RaidGuild Portal\n\nA community portal for current activity, projects, events, threads, and reviewed knowledge.\n\n- [Public content map](/llms.txt)\n- [Posts](/posts)\n- [Projects](/projects)\n- [Events](/events)\n- [Wiki](/wiki)',
    )
  }

  const route = listCollections[parts[0] as keyof typeof listCollections]
  if (!route || parts.length > 2) return response('# Not found', 404)

  const payload = await getPayload({ config: configPromise })
  const isWiki = route.collection === 'wikiPages'
  const result = await payload.find({
    collection: route.collection,
    draft: false,
    limit: parts[1] ? 1 : 50,
    overrideAccess: false,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        ...(publicWhere(parts[1] ? route.key : undefined, parts[1]).and || []),
        ...(isWiki ? [{ reviewStatus: { equals: 'reviewed' } }] : []),
      ],
    },
  })
  const docs = result.docs as MarkdownDocument[]

  if (parts[1]) {
    const doc = docs[0]
    if (!doc) return response('# Not found', 404)
    const body = doc.summary || clean(text(doc.content?.root?.children).join(' '))
    return response(
      [
        `# ${escape(doc.title || 'Untitled')}`,
        body ? `\n${body}` : '',
        `\nCanonical: ${path}`,
      ].join('\n'),
    )
  }

  const title =
    parts[0] === 'wiki' ? 'Reviewed Wiki Pages' : `${parts[0][0].toUpperCase()}${parts[0].slice(1)}`
  const items = docs.map((doc) => {
    const key = route.key === 'id' ? doc.id : doc.slug
    const summary = doc.summary ? ` - ${escape(doc.summary)}` : ''
    return `- [${escape(doc.title || 'Untitled')}](/${parts[0]}/${key})${summary}`
  })
  return response([`# ${title}`, '', ...items].join('\n'))
}
