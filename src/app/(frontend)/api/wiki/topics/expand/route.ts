import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import { hasRole } from '@/access/roles'
import type { Event, WikiPage, WikiTopic } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import {
  getPrismRequestArtifactsURL,
  PrismHookConfigError,
  triggerPrismHook,
} from '@/utilities/prismHooks'

type ExpandBody = {
  modes?: unknown
  steeringPrompt?: unknown
  topicID?: unknown
}

const DEFAULT_STEERING_PROMPT = `Expand this topic for the RaidGuild Portal Infinite Wiki.

Prefer technical, researchable, source-backed topics. Avoid generic AI hype, marketing angles, hot takes, personal opinions, and editorial positioning.

Suggested topics should be useful for builders, researchers, educators, protocol designers, or community operators. Each suggestion should include why it belongs in the tree, what evidence would be needed, and what sources Prism should search.

Do not invent facts. If the current evidence is thin, propose research questions instead of article claims.`

const WIKI_TOPIC_EXPAND_HOOK_KEY =
  process.env.PRISM_WIKI_TOPIC_EXPAND_HOOK_KEY?.trim() || 'wiki-topic-expand'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to expand wiki topics.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'agent', 'member'])) {
    return Response.json(
      { message: 'A member account is required to expand wiki topics.' },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => null)) as ExpandBody | null
  const topicID = numberValue(body?.topicID)

  if (!topicID) {
    return Response.json({ message: 'Provide a topicID.' }, { status: 400 })
  }

  const topic = await getVisibleTopic(payload, topicID, user)

  if (!topic) {
    return Response.json({ message: 'No matching topic found.' }, { status: 404 })
  }

  const [parentPath, siblingTopics] = await Promise.all([
    getParentPath(payload, topic),
    getSiblingTopics(payload, topic),
  ])
  const sourceSessions = relationDocs<Event>(topic.sourceSessions).map((session) => ({
    id: session.id,
    startsAt: session.startsAt,
    title: session.title,
  }))
  const sourceArtifacts = (topic.sourceArtifacts || []).map((artifact) => ({
    artifactID: artifact.artifactID,
    label: artifact.label,
    url: artifact.url,
  }))
  const relatedArticles = relatedWikiPages(topic).map((page) => ({
    id: page.id,
    slug: page.slug,
    status: page._status || 'draft',
    title: page.title,
  }))
  const sourceQueries = (topic.sourceQueries || [])
    .map((query) => query.query)
    .filter((query): query is string => Boolean(query))
  const steeringPrompt =
    stringValue(body?.steeringPrompt) || topic.expansionPrompt || DEFAULT_STEERING_PROMPT

  const prismPayload = {
    parentPath,
    portalURL: getServerSideURL(),
    relatedArticles,
    requestedByUserID: user.id,
    requestedModes: requestedModes(body?.modes),
    siblingTopics,
    sourceArtifacts,
    sourceQueries,
    sourceSessions,
    steeringPrompt,
    topicID: topic.id,
    topicKind: topic.kind,
    topicSlug: topic.slug,
    topicTitle: topic.title,
  }

  try {
    const result = await triggerPrismHook({
      hookKey: WIKI_TOPIC_EXPAND_HOOK_KEY,
      payload: prismPayload,
    })
    const updatedTopic = await markTopicExpanded({
      payload,
      result,
      topic,
      user,
    })
    const prismRequest = result.changeRequest
      ? {
          artifactsURL: result.changeRequest.requestNumber
            ? getPrismRequestArtifactsURL(result.changeRequest.requestNumber)
            : null,
          id: result.changeRequest.id,
          requestNumber: result.changeRequest.requestNumber,
          title: result.changeRequest.title,
        }
      : null

    return Response.json({
      hookKey: WIKI_TOPIC_EXPAND_HOOK_KEY,
      message: prismResultMessage(result),
      prism: {
        autoStartQueued: result.autoStartQueued,
        hook: result.hook,
        request: prismRequest,
      },
      topic: {
        id: updatedTopic.id,
        lastExpandedAt: updatedTopic.lastExpandedAt,
        slug: updatedTopic.slug,
        title: updatedTopic.title,
      },
    })
  } catch (error) {
    const status = error instanceof PrismHookConfigError ? 503 : 502

    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Prism topic expansion failed.',
      },
      { status },
    )
  }
}

const markTopicExpanded = async ({
  payload,
  result,
  topic,
  user,
}: {
  payload: Payload
  result: Awaited<ReturnType<typeof triggerPrismHook>>
  topic: WikiTopic
  user: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>
}) => {
  const observedAt = new Date().toISOString()
  const requestNumber = result.changeRequest?.requestNumber
  const artifactsURL = requestNumber ? getPrismRequestArtifactsURL(requestNumber) : null
  const sourceArtifacts = mergeSourceArtifacts(topic.sourceArtifacts, {
    artifactID: requestNumber ? `prism-request-${requestNumber}` : result.changeRequest?.id,
    label: requestNumber
      ? `Prism expansion request #${requestNumber}`
      : 'Prism expansion request',
    observedAt,
    sourceQuery: `Triggered Prism hook ${WIKI_TOPIC_EXPAND_HOOK_KEY} for topic expansion.`,
    sourceType: 'prism',
    url: artifactsURL || undefined,
  })

  return payload.update({
    id: topic.id,
    collection: 'wikiTopics',
    data: {
      lastExpandedAt: observedAt,
      sourceArtifacts,
    },
    overrideAccess: true,
    user,
  })
}

const mergeSourceArtifacts = (
  existing: WikiTopic['sourceArtifacts'],
  next: NonNullable<WikiTopic['sourceArtifacts']>[number],
) => {
  const artifacts = [...(existing || [])]
  const nextKey = sourceArtifactKey(next)
  const existingIndex = artifacts.findIndex((artifact) => sourceArtifactKey(artifact) === nextKey)

  if (existingIndex >= 0) {
    artifacts[existingIndex] = {
      ...artifacts[existingIndex],
      ...next,
    }
    return artifacts
  }

  return [...artifacts, next]
}

const sourceArtifactKey = (artifact: NonNullable<WikiTopic['sourceArtifacts']>[number]) =>
  artifact.artifactID || artifact.url || artifact.label

const getVisibleTopic = async (
  payload: Payload,
  topicID: number,
  user: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>,
) => {
  try {
    return await payload.findByID({
      id: topicID,
      collection: 'wikiTopics',
      depth: 2,
      overrideAccess: false,
      user,
    })
  } catch {
    return null
  }
}

const getParentPath = async (payload: Payload, topic: WikiTopic) => {
  const path: { id: number; slug?: string | null; title: string }[] = []
  let parent = relationDoc<WikiTopic>(topic.parentTopic)
  const seen = new Set<number>()

  while (parent && !seen.has(parent.id)) {
    seen.add(parent.id)
    path.unshift({
      id: parent.id,
      slug: parent.slug,
      title: parent.title,
    })

    const nextParentID = relationID(parent.parentTopic)
    if (!nextParentID) break

    parent = await payload.findByID({
      id: nextParentID,
      collection: 'wikiTopics',
      depth: 1,
      overrideAccess: true,
    })
  }

  return path
}

const getSiblingTopics = async (payload: Payload, topic: WikiTopic) => {
  const parentID = relationID(topic.parentTopic)

  if (!parentID) return []

  const result = await payload.find({
    collection: 'wikiTopics',
    depth: 0,
    limit: 25,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder,title',
    where: {
      and: [
        {
          parentTopic: {
            equals: parentID,
          },
        },
        {
          id: {
            not_equals: topic.id,
          },
        },
        {
          reviewStatus: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs.map((sibling) => ({
    id: sibling.id,
    slug: sibling.slug,
    title: sibling.title,
  }))
}

const relatedWikiPages = (topic: WikiTopic): WikiPage[] => {
  const pages = [
    relationDoc<WikiPage>(topic.canonicalPage),
    ...relationDocs<WikiPage>(topic.relatedPages),
  ].filter(Boolean) as WikiPage[]
  const seen = new Set<number>()

  return pages.filter((page) => {
    if (seen.has(page.id)) return false
    seen.add(page.id)
    return true
  })
}

const requestedModes = (value: unknown) => {
  const allowed = new Set(['children', 'siblings', 'articles', 'sources'])
  const modes = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && allowed.has(item))
    : []

  return modes.length ? modes : ['children', 'siblings', 'articles', 'sources']
}

const prismResultMessage = (result: Awaited<ReturnType<typeof triggerPrismHook>>) => {
  const requestNumber = result.changeRequest?.requestNumber

  if (requestNumber) {
    return `Prism expansion request #${requestNumber} was created.`
  }

  return 'Prism expansion request was created.'
}

const relationDoc = <T extends { id: number }>(item?: number | T | null): T | null =>
  item && typeof item === 'object' ? item : null

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const relationID = (item?: number | { id: number } | null) =>
  typeof item === 'number' ? item : item?.id || null

const numberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const stringValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
