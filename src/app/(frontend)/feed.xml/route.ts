import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import type { Category, Post } from '@/payload-types'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

const FEED_TITLE = 'RaidGuild Portal Posts'
const FEED_DESCRIPTION = 'Public posts from the RaidGuild Portal.'
const FEED_LIMIT = 100

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
}

type FeedPostFields = Pick<
  Post,
  'artifactKind' | 'categories' | 'content' | 'contentType' | 'meta' | 'populatedAuthors'
>

const escapeXML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const formatRSSDate = (value: string | Date): string => new Date(value).toUTCString()

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '')

const collectLexicalText = (nodes: LexicalNode[] | undefined): string[] => {
  if (!nodes?.length) return []

  return nodes.flatMap((node) => {
    const ownText = typeof node.text === 'string' ? [node.text] : []
    return [...ownText, ...collectLexicalText(node.children)]
  })
}

const truncateDescription = (value: string, maxLength = 280): string => {
  if (value.length <= maxLength) return value

  const trimmed = value.slice(0, Math.max(0, maxLength - 3)).trimEnd()
  return `${trimmed}...`
}

const getPostDescription = (post: Pick<FeedPostFields, 'content' | 'meta'>): string => {
  const metaDescription = post.meta?.description?.trim()

  if (metaDescription) return metaDescription

  const lexicalText = collectLexicalText(post.content?.root?.children as LexicalNode[] | undefined)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return truncateDescription(lexicalText)
}

const getPostAuthors = (post: Pick<FeedPostFields, 'populatedAuthors'>): string | null => {
  const authors =
    post.populatedAuthors
      ?.map((author) => author.name?.trim())
      .filter(Boolean)
      .join(', ') || ''

  return authors || null
}

const getPostCategories = (
  post: Pick<FeedPostFields, 'artifactKind' | 'categories' | 'contentType'>,
): string[] =>
  [
    post.contentType,
    post.artifactKind && post.artifactKind !== post.contentType ? post.artifactKind : null,
    ...(post.categories || []).map((category) =>
      typeof category === 'object' ? (category as Category).title : null,
    ),
  ].filter((value): value is string => Boolean(value))

const renderTag = (tag: string, value: string): string =>
  value ? `<${tag}>${escapeXML(value)}</${tag}>` : ''

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const siteURL = stripTrailingSlash(getServerSideURL())
  const feedURL = `${siteURL}/feed.xml`
  const now = new Date()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: FEED_LIMIT,
    overrideAccess: false,
    pagination: false,
    select: {
      categories: true,
      content: true,
      contentType: true,
      artifactKind: true,
      meta: true,
      populatedAuthors: true,
      publishedAt: true,
      slug: true,
      title: true,
      updatedAt: true,
      visibility: true,
    },
    sort: '-publishedAt',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    },
  })

  const items = posts.docs
    .filter((post) => post.slug)
    .map((post) => {
      const url = `${siteURL}/posts/${post.slug}`
      const description = getPostDescription(post)
      const date = post.publishedAt || post.updatedAt || now.toISOString()
      const author = getPostAuthors(post)
      const categories = getPostCategories(post)

      return [
        '<item>',
        renderTag('title', post.title),
        renderTag('link', url),
        renderTag('guid', url),
        renderTag('description', description),
        renderTag('pubDate', formatRSSDate(date)),
        author ? renderTag('dc:creator', author) : '',
        ...categories.map((category) => renderTag('category', category)),
        '</item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
${renderTag('title', FEED_TITLE)}
${renderTag('description', FEED_DESCRIPTION)}
${renderTag('link', siteURL)}
<atom:link href="${escapeXML(feedURL)}" rel="self" type="application/rss+xml" />
${renderTag('language', 'en')}
${renderTag('lastBuildDate', formatRSSDate(now))}
${renderTag('copyright', `${now.getUTCFullYear()} RaidGuild`)}
${items}
</channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
