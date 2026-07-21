import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import type { Event, Page, Post, Project, WikiPage } from '@/payload-types'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

const CONTENT_LIMIT = 24
const POST_LIMIT = 32
const SUMMARY_LIMIT = 220

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
}

type MarkdownItem = {
  date?: string | null
  description?: string | null
  label?: string | null
  title: string
  url: string
}

type PublicPost = Pick<
  Post,
  | 'artifactKind'
  | 'content'
  | 'contentType'
  | 'meta'
  | 'publishedAt'
  | 'slug'
  | 'title'
  | 'updatedAt'
>

type PublicPage = Pick<Page, 'meta' | 'publishedAt' | 'slug' | 'title' | 'updatedAt'>

type PublicEvent = Pick<
  Event,
  'id' | 'publishedAt' | 'sessionType' | 'startsAt' | 'summary' | 'title' | 'updatedAt'
>

type PublicProject = Pick<
  Project,
  | 'lastActiveAt'
  | 'projectKind'
  | 'projectStatus'
  | 'publishedAt'
  | 'slug'
  | 'summary'
  | 'title'
  | 'updatedAt'
>

type PublicWikiPage = Pick<
  WikiPage,
  'lastReviewedAt' | 'lastRefreshedAt' | 'publishedAt' | 'slug' | 'summary' | 'title' | 'updatedAt'
>

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '')

const cleanWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

const escapeMarkdown = (value: string): string =>
  cleanWhitespace(value)
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/#/g, '\\#')
    .replace(/\|/g, '\\|')

const truncate = (value: string, maxLength = SUMMARY_LIMIT): string => {
  const cleaned = cleanWhitespace(value)

  if (cleaned.length <= maxLength) return cleaned

  return `${cleaned.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

const formatDate = (value?: string | null): string | null => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().slice(0, 10)
}

const isLexicalNode = (value: unknown): value is LexicalNode =>
  Boolean(value && typeof value === 'object')

const collectLexicalText = (nodes: unknown[] | undefined): string[] => {
  if (!nodes?.length) return []

  return nodes.flatMap((node) => {
    if (!isLexicalNode(node)) return []

    const ownText = typeof node.text === 'string' ? [node.text] : []
    return [...ownText, ...collectLexicalText(node.children)]
  })
}

const getLexicalSummary = (content?: { root?: { children?: unknown[] } } | null): string => {
  return truncate(collectLexicalText(content?.root?.children).join(' ').replace(/\s+/g, ' ').trim())
}

const getPostSummary = (post: Pick<PublicPost, 'content' | 'meta'>): string | null => {
  const metaDescription = post.meta?.description?.trim()

  if (metaDescription) return truncate(metaDescription)

  return getLexicalSummary(post.content) || null
}

const itemLine = ({ date, description, label, title, url }: MarkdownItem): string => {
  const meta = [label, date ? `Updated ${date}` : null].filter(Boolean).join('; ')
  const suffix = [
    meta ? ` (${escapeMarkdown(meta)})` : null,
    description ? ` - ${escapeMarkdown(description)}` : null,
  ]
    .filter(Boolean)
    .join('')

  return `- [${escapeMarkdown(title)}](${url})${suffix}`
}

const renderSection = (title: string, items: MarkdownItem[]): string | null => {
  if (!items.length) return null

  return [`## ${title}`, '', ...items.map(itemLine)].join('\n')
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const siteURL = stripTrailingSlash(getServerSideURL())
  const now = new Date()

  const [pages, posts, events, projects, wikiPages] = await Promise.all([
    payload.find({
      collection: 'pages',
      draft: false,
      limit: CONTENT_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        meta: true,
        publishedAt: true,
        slug: true,
        title: true,
        updatedAt: true,
      },
      sort: '-updatedAt',
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            slug: {
              exists: true,
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'posts',
      draft: false,
      limit: POST_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        artifactKind: true,
        content: true,
        contentType: true,
        meta: true,
        publishedAt: true,
        slug: true,
        title: true,
        updatedAt: true,
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
          {
            slug: {
              exists: true,
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'events',
      draft: false,
      limit: CONTENT_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        id: true,
        publishedAt: true,
        sessionType: true,
        startsAt: true,
        summary: true,
        title: true,
        updatedAt: true,
      },
      sort: '-startsAt',
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
    }),
    payload.find({
      collection: 'projects',
      draft: false,
      limit: CONTENT_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        lastActiveAt: true,
        projectKind: true,
        projectStatus: true,
        publishedAt: true,
        slug: true,
        summary: true,
        title: true,
        updatedAt: true,
      },
      sort: '-lastActiveAt',
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
          {
            slug: {
              exists: true,
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'wikiPages',
      draft: false,
      limit: CONTENT_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        lastReviewedAt: true,
        lastRefreshedAt: true,
        publishedAt: true,
        slug: true,
        summary: true,
        title: true,
        updatedAt: true,
      },
      sort: '-lastReviewedAt',
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
          {
            reviewStatus: {
              equals: 'reviewed',
            },
          },
          {
            slug: {
              exists: true,
            },
          },
        ],
      },
    }),
  ])

  const sections = [
    renderSection(
      'Public Pages',
      (pages.docs as PublicPage[])
        .filter((page) => page.slug && page.slug !== 'home')
        .map((page) => ({
          date: formatDate(page.publishedAt || page.updatedAt),
          description: page.meta?.description ? truncate(page.meta.description) : null,
          title: page.meta?.title || page.title,
          url: `${siteURL}/${page.slug}`,
        })),
    ),
    renderSection(
      'Posts And Articles',
      (posts.docs as PublicPost[])
        .filter((post) => post.slug)
        .map((post) => ({
          date: formatDate(post.publishedAt || post.updatedAt),
          description: getPostSummary(post),
          label:
            post.artifactKind && post.artifactKind !== post.contentType
              ? post.artifactKind
              : post.contentType,
          title: post.title,
          url: `${siteURL}/posts/${post.slug}`,
        })),
    ),
    renderSection(
      'Sessions And Events',
      (events.docs as PublicEvent[]).map((event) => ({
        date: formatDate(event.startsAt || event.publishedAt || event.updatedAt),
        description: event.summary ? truncate(event.summary) : null,
        label: event.sessionType,
        title: event.title,
        url: `${siteURL}/events/${event.id}`,
      })),
    ),
    renderSection(
      'Projects',
      (projects.docs as PublicProject[])
        .filter((project) => project.slug)
        .map((project) => ({
          date: formatDate(project.lastActiveAt || project.publishedAt || project.updatedAt),
          description: project.summary ? truncate(project.summary) : null,
          label: [project.projectKind, project.projectStatus].filter(Boolean).join('; '),
          title: project.title,
          url: `${siteURL}/projects/${project.slug}`,
        })),
    ),
    renderSection(
      'Reviewed Wiki Pages',
      (wikiPages.docs as PublicWikiPage[])
        .filter((page) => page.slug)
        .map((page) => ({
          date: formatDate(
            page.lastReviewedAt || page.lastRefreshedAt || page.publishedAt || page.updatedAt,
          ),
          description: page.summary ? truncate(page.summary) : null,
          label: 'reviewed wiki',
          title: page.title,
          url: `${siteURL}/wiki/${page.slug}`,
        })),
    ),
  ].filter((section): section is string => Boolean(section))

  const markdown = [
    '# RaidGuild Portal',
    '',
    'A concise index of public, published Portal CMS content for LLM-powered tools and agents.',
    '',
    `Generated: ${now.toISOString()}`,
    `Canonical site: ${siteURL}`,
    '',
    'This file intentionally excludes drafts, authenticated-only records, member-only records, admin-only records, preview URLs, and private source artifact links.',
    '',
    ...sections,
    '',
  ].join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
