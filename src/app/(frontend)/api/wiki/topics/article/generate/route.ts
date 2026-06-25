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

type GenerateArticleBody = {
  steeringPrompt?: unknown
  topicID?: unknown
}

const DEFAULT_STEERING_PROMPT = `Generate a source-backed RaidGuild Portal wiki article draft for this topic.

Write research-backed article content, not an opinion essay or marketing piece. Use available Portal, Prism, session, artifact, and external sources. If evidence is thin, create a cautious draft with open questions and clearly marked low confidence instead of unsupported claims.

Do not publish the article. Create a draft wiki page and link it back to the source wiki topic.`

const WIKI_ARTICLE_GENERATE_HOOK_KEY =
  process.env.PRISM_WIKI_ARTICLE_GENERATE_HOOK_KEY?.trim() || 'wiki-article-generate'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to generate wiki articles.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'agent', 'member'])) {
    return Response.json(
      { message: 'A member account is required to generate wiki articles.' },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => null)) as GenerateArticleBody | null
  const topicID = numberValue(body?.topicID)

  if (!topicID) {
    return Response.json({ message: 'Provide a topicID.' }, { status: 400 })
  }

  const topic = await getVisibleTopic(payload, topicID, user)

  if (!topic) {
    return Response.json({ message: 'No matching topic found.' }, { status: 404 })
  }

  if (topic.kind === 'category') {
    return Response.json(
      { message: 'Generate articles from topic, subtopic, or possible nodes, not categories.' },
      { status: 400 },
    )
  }

  if (relationID(topic.canonicalPage)) {
    return Response.json(
      { message: 'This topic already has a canonical wiki article.' },
      { status: 409 },
    )
  }

  const [parentPath, relatedTopics] = await Promise.all([
    getParentPath(payload, topic),
    getRelatedTopics(payload, topic),
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
  const sourceQueries = (topic.sourceQueries || [])
    .map((query) => query.query)
    .filter((query): query is string => Boolean(query))
  const steeringPrompt = stringValue(body?.steeringPrompt) || DEFAULT_STEERING_PROMPT

  try {
    const result = await triggerPrismHook({
      hookKey: WIKI_ARTICLE_GENERATE_HOOK_KEY,
      payload: {
        parentPath,
        portalURL: getServerSideURL(),
        relatedTopics,
        requestedByUserID: user.id,
        sourceArtifacts,
        sourceQueries,
        sourceSessions,
        steeringPrompt,
        topicID: topic.id,
        topicKind: topic.kind,
        topicSlug: topic.slug,
        topicSummary: topic.summary,
        topicTitle: topic.title,
        topicVisibility: topic.visibility,
      },
    })
    const updatedTopic = await markArticleGenerationRequested({
      payload,
      result,
      topic,
      user,
    })
    const requestNumber = result.changeRequest?.requestNumber

    return Response.json({
      hookKey: WIKI_ARTICLE_GENERATE_HOOK_KEY,
      message: requestNumber
        ? `Prism article generation request #${requestNumber} was created.`
        : 'Prism article generation request was created.',
      prism: {
        autoStartQueued: result.autoStartQueued,
        hook: result.hook,
        request: result.changeRequest
          ? {
              artifactsURL: requestNumber ? getPrismRequestArtifactsURL(requestNumber) : null,
              id: result.changeRequest.id,
              requestNumber,
              title: result.changeRequest.title,
            }
          : null,
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
        message: error instanceof Error ? error.message : 'Prism article generation failed.',
      },
      { status },
    )
  }
}

const markArticleGenerationRequested = async ({
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

  return payload.update({
    id: topic.id,
    collection: 'wikiTopics',
    data: {
      lastExpandedAt: observedAt,
      sourceArtifacts: mergeSourceArtifacts(topic.sourceArtifacts, {
        artifactID: requestNumber ? `prism-article-request-${requestNumber}` : result.changeRequest?.id,
        label: requestNumber
          ? `Prism article generation request #${requestNumber}`
          : 'Prism article generation request',
        observedAt,
        sourceQuery: `Triggered Prism hook ${WIKI_ARTICLE_GENERATE_HOOK_KEY} for wiki article generation.`,
        sourceType: 'prism',
        url: artifactsURL || undefined,
      }),
    },
    overrideAccess: true,
    user,
  })
}

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

const getRelatedTopics = async (payload: Payload, topic: WikiTopic) => {
  const related = relationDocs<WikiTopic>(topic.relatedTopics)
  const parent = relationDoc<WikiTopic>(topic.parentTopic)
  const siblingResult = parent
    ? await payload.find({
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
                equals: parent.id,
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
    : null
  const seen = new Set<number>()

  return [...related, ...(siblingResult?.docs || [])]
    .filter((relatedTopic) => {
      if (seen.has(relatedTopic.id)) return false
      seen.add(relatedTopic.id)
      return true
    })
    .map((relatedTopic) => ({
      id: relatedTopic.id,
      kind: relatedTopic.kind,
      slug: relatedTopic.slug,
      summary: relatedTopic.summary,
      title: relatedTopic.title,
    }))
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
