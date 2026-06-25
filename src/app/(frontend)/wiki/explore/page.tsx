import type { Metadata } from 'next'
import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import type { Event, WikiPage, WikiTopic } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { VerifyAccountNotice } from '../../_components/VerifyAccountNotice'

import { WikiGraphExplorer, type WikiExplorerGraphData } from './WikiGraphExplorer'

export const dynamic = 'force-dynamic'

export default async function WikiExplorePage() {
  const user = await getCurrentUser()
  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])
  const canExploreWiki = canManageWiki || hasRole(user, 'member')

  if (!user) {
    return (
      <main className="container pb-24 pt-12">
        <section className="max-w-3xl">
          <p className="mb-4 portal-kicker">Infinite Wiki</p>
          <h1 className="portal-title">Explore Wiki Graph</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Log in as a member to explore suggested topics, draft articles, and source-backed
            research paths.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="portal-admin-link" href="/join">
              Join to explore
            </Link>
            <Link className="portal-admin-link" href="/login?next=%2Fwiki%2Fexplore">
              Log in
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (!canExploreWiki) {
    return (
      <VerifyAccountNotice description="A member account is required to explore generated wiki topics and draft research nodes." />
    )
  }

  const graphData = await getWikiExplorerGraphData({ canManageWiki })

  return (
    <main className="mx-auto w-full max-w-[92rem] px-5 pb-24 pt-12 sm:px-8">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Infinite Wiki</p>
          <h1 className="portal-title">Explore Wiki Graph</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            Move through topic categories, article nodes, and source-backed research paths without
            leaving the wiki map.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canManageWiki ? (
            <Link className="portal-admin-link" href="/admin/collections/wikiTopics">
              Manage topics
            </Link>
          ) : null}
          <Link className="portal-admin-link" href="/wiki">
            Wiki index
          </Link>
        </div>
      </section>

      <WikiGraphExplorer canManageWiki={canManageWiki} data={graphData} />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Explore RaidGuild Wiki Graph',
}

const getWikiExplorerGraphData = async ({
  canManageWiki,
}: {
  canManageWiki: boolean
}): Promise<WikiExplorerGraphData> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'wikiTopics',
    depth: 2,
    limit: 300,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder,title',
    where: canManageWiki
      ? undefined
      : {
          and: [
            {
              reviewStatus: {
                not_equals: 'archived',
              },
            },
            {
              visibility: {
                not_equals: 'admin',
              },
            },
          ],
        },
  })

  return normalizeWikiGraph(result.docs)
}

const normalizeWikiGraph = (topics: WikiTopic[]): WikiExplorerGraphData => {
  const nodes = new Map<string, WikiExplorerGraphData['nodes'][number]>()
  const links = new Map<string, WikiExplorerGraphData['links'][number]>()
  const articleIDs = new Set<number>()
  const sourceIDs = new Set<string>()

  for (const topic of topics) {
    const topicID = topicNodeID(topic.id)
    const parentTopic = relationDoc<WikiTopic>(topic.parentTopic)
    const canonicalPage = relationDoc<WikiPage>(topic.canonicalPage)
    const relatedPages = relationDocs<WikiPage>(topic.relatedPages)
    const pages = uniquePages([canonicalPage, ...relatedPages].filter(Boolean) as WikiPage[])

    nodes.set(topicID, {
      articleCount: pages.length,
      confidence: topic.confidence,
      id: topicID,
      kind: topic.kind,
      label: topic.title,
      lastExpandedAt: topic.lastExpandedAt,
      lastReviewedAt: topic.lastReviewedAt,
      reviewStatus: topic.reviewStatus,
      sourceSessions: relationDocs<Event>(topic.sourceSessions).map(sessionSummary),
      slug: topic.slug,
      sourceCount: topic.sourceArtifacts?.length || 0,
      summary: topic.summary,
      type:
        topic.kind === 'category' ? 'category' : topic.kind === 'possible' ? 'possible' : 'topic',
      visibility: topic.visibility,
    })

    if (parentTopic) {
      links.set(`${topicNodeID(parentTopic.id)}->${topicID}:contains`, {
        source: topicNodeID(parentTopic.id),
        target: topicID,
        type: 'contains',
      })
    }

    for (const relatedTopic of relationDocs<WikiTopic>(topic.relatedTopics)) {
      const relatedID = topicNodeID(relatedTopic.id)

      if (relatedID !== topicID) {
        links.set(`${topicID}->${relatedID}:relates_to`, {
          source: topicID,
          target: relatedID,
          type: 'relates_to',
        })
      }
    }

    for (const page of pages) {
      const articleID = articleNodeID(page.id)

      if (!articleIDs.has(page.id)) {
        articleIDs.add(page.id)
        nodes.set(articleID, {
          bodySections: extractLexicalSections(page.body),
          bodyText: extractLexicalText(page.body),
          confidence: page.confidence,
          discoveryLinks: {
            furtherReading: normalizeDiscoveryLinks(page.furtherReading),
            papers: normalizeDiscoveryLinks(page.papers),
            tools: normalizeDiscoveryLinks(page.tools),
          },
          href: page.slug ? `/wiki/${page.slug}` : null,
          id: articleID,
          label: page.title,
          lastReviewedAt: page.lastReviewedAt,
          lastRefreshedAt: page.lastRefreshedAt,
          reviewStatus: page.reviewStatus,
          sourceSessions: relationDocs<Event>(page.sourceSessions).map(sessionSummary),
          slug: page.slug,
          sourceCount: page.sourceArtifacts?.length || 0,
          status: page._status,
          summary: page.summary,
          type: 'article',
          visibility: page.visibility,
        })
      }

      links.set(`${topicID}->${articleID}:has_article`, {
        source: topicID,
        target: articleID,
        type: 'has_article',
      })

      for (const artifact of page.sourceArtifacts || []) {
        const sourceID = sourceNodeID(artifact.url || artifact.artifactID || artifact.label)

        if (!sourceIDs.has(sourceID)) {
          sourceIDs.add(sourceID)
          nodes.set(sourceID, {
            artifactID: artifact.artifactID,
            id: sourceID,
            label: artifact.label,
            observedAt: artifact.observedAt,
            sourceType: artifact.sourceType || 'external',
            sourceURL: artifact.url,
            type: 'source',
          })
        }

        links.set(`${articleID}->${sourceID}:has_source`, {
          source: articleID,
          target: sourceID,
          type: 'has_source',
        })
      }
    }

    for (const artifact of topic.sourceArtifacts || []) {
      const sourceID = sourceNodeID(artifact.url || artifact.artifactID || artifact.label)

      if (!sourceIDs.has(sourceID)) {
        sourceIDs.add(sourceID)
        nodes.set(sourceID, {
          artifactID: artifact.artifactID,
          id: sourceID,
          label: artifact.label,
          observedAt: artifact.observedAt,
          sourceType: artifact.sourceType || 'external',
          sourceURL: artifact.url,
          type: 'source',
        })
      }

      links.set(`${topicID}->${sourceID}:has_source`, {
        source: topicID,
        target: sourceID,
        type: 'has_source',
      })
    }
  }

  return {
    links: Array.from(links.values()),
    nodes: Array.from(nodes.values()),
  }
}

const relationDoc = <T extends { id: number }>(item?: number | T | null): T | null =>
  item && typeof item === 'object' ? item : null

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const sessionSummary = (event: Event) => ({
  id: event.id,
  title: event.title,
})

const normalizeDiscoveryLinks = (
  links?: { label: string; note?: string | null; url?: string | null }[] | null,
) =>
  (links || [])
    .filter((link) => link.label || link.url)
    .map((link) => ({
      label: link.label || link.url || 'Untitled link',
      note: link.note,
      url: link.url,
    }))

const uniquePages = (pages: WikiPage[]) => {
  const seen = new Set<number>()

  return pages.filter((page) => {
    if (seen.has(page.id)) return false
    seen.add(page.id)
    return true
  })
}

const topicNodeID = (id: number) => `topic:${id}` as const
const articleNodeID = (id: number) => `article:${id}` as const
const sourceNodeID = (id: string) => `source:${encodeURIComponent(id)}` as const

const extractLexicalText = (content: unknown): string => {
  return extractLexicalSections(content).join(' ').replace(/\s+/g, ' ').trim()
}

const extractLexicalSections = (content: unknown): string[] => {
  if (!content || typeof content !== 'object' || !('root' in content)) return []

  const root = content as { root?: { children?: unknown[] } }
  const chunks: string[] = []
  const textForNode = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    if ('text' in node && typeof node.text === 'string') return node.text
    if ('children' in node && Array.isArray(node.children)) {
      return node.children.map(textForNode).join(' ')
    }

    return ''
  }

  for (const node of root.root?.children || []) {
    const text = textForNode(node).replace(/\s+/g, ' ').trim()
    if (text) chunks.push(text)
  }

  return chunks
}
