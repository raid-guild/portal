import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import { hasRole } from '@/access/roles'
import type { WikiPage, WikiTopic } from '@/payload-types'
import {
  fetchPrismRequestArtifacts,
  getPrismRequestArtifactsURL,
  PrismHookConfigError,
} from '@/utilities/prismHooks'

type ImportBody = {
  focusTopicID?: unknown
  requestNumber?: unknown
  requestURL?: unknown
}

type Proposal = {
  articleCandidates: ProposalArticle[]
  externalLinks: ProposalExternalLink[]
  focusTopic?: {
    id?: number | string
    kind?: string
    slug?: string
    title?: string
  }
  mode?: string | string[]
  suggestedTopics: ProposalTopic[]
  warnings: string[]
}

type ProposalTopic = {
  confidence?: 'low' | 'medium' | 'high'
  kind?: 'category' | 'possible' | 'subtopic' | 'topic'
  rationale?: string
  relationship?: 'child' | 'related' | 'sibling'
  sourceArtifacts?: ProposalSourceArtifact[]
  sourceQueries?: string[]
  sourceSessionIds?: (number | string)[]
  summary?: string
  title?: string
}

type ProposalArticle = {
  confidence?: 'low' | 'medium' | 'high'
  researchSlots?: string[]
  sourceArtifacts?: ProposalSourceArtifact[]
  sourceQueries?: string[]
  sourceSessionIds?: (number | string)[]
  summary?: string
  title?: string
}

type ProposalExternalLink = {
  label?: string
  note?: string
  sourceType?: 'blog' | 'external' | 'paper' | 'tool'
  url?: string
}

type ProposalSourceArtifact = {
  artifactID?: string
  label?: string
  url?: string
}

type SourceArtifact = NonNullable<WikiTopic['sourceArtifacts']>[number]

const PROPOSAL_ARTIFACT_NAME = 'wiki-topic-expansion-proposal.json'
const PROMPT_VERSION = 'wiki-topic-expansion-proposal-v1'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to import Prism topic proposals.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'agent', 'member'])) {
    return Response.json(
      { message: 'A member account is required to import Prism topic proposals.' },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => null)) as ImportBody | null
  const requestNumber = numberValue(body?.requestNumber) || requestNumberFromURL(body?.requestURL)

  if (!requestNumber) {
    return Response.json({ message: 'Provide a Prism request number or request artifact URL.' }, { status: 400 })
  }

  const focusTopicID = numberValue(body?.focusTopicID)
  const focusTopic = focusTopicID ? await getTopic(payload, focusTopicID) : null

  if (focusTopicID && !focusTopic) {
    return Response.json({ message: 'No matching focus topic found.' }, { status: 404 })
  }

  try {
    const artifactsResult = await fetchPrismRequestArtifacts(requestNumber)
    const proposalArtifact = findProposalArtifact(artifactsResult.artifacts || [])

    if (!proposalArtifact?.content?.body) {
      return Response.json(
        { message: `No ${PROPOSAL_ARTIFACT_NAME} artifact found on Prism request #${requestNumber}.` },
        { status: 404 },
      )
    }

    const proposal = parseProposal(proposalArtifact.content.body)
    const observedAt = new Date().toISOString()
    const requestArtifactURL = getPrismRequestArtifactsURL(requestNumber) || undefined
    const requestSourceArtifact: SourceArtifact = {
      artifactID: `prism-request-${requestNumber}`,
      label: `Prism expansion proposal #${requestNumber}`,
      observedAt,
      sourceQuery: `Imported ${PROPOSAL_ARTIFACT_NAME} from Prism request #${requestNumber}.`,
      sourceType: 'prism',
      url: requestArtifactURL,
    }
    const inferredFocusTopic =
      focusTopic ||
      (numberValue(proposal.focusTopic?.id) ? await getTopic(payload, numberValue(proposal.focusTopic?.id)!) : null)
    const sourceSessionIDs = uniqueNumbers([
      ...relationIDs(inferredFocusTopic?.sourceSessions),
      ...proposalSourceSessionIDs(proposal),
    ])
    const importedTopics: WikiTopic[] = []
    const importedPages: WikiPage[] = []

    for (const topicProposal of proposal.suggestedTopics) {
      const importedTopic = await upsertProposalTopic(payload, {
        focusTopic: inferredFocusTopic,
        generatedByID: Number(user.id),
        proposal: topicProposal,
        requestSourceArtifact,
        sourceSessionIDs,
      })

      if (importedTopic) importedTopics.push(importedTopic)
    }

    for (const articleProposal of proposal.articleCandidates) {
      const page = await upsertProposalPage(payload, {
        externalLinks: proposal.externalLinks,
        focusTopic: inferredFocusTopic,
        proposal: articleProposal,
        requestSourceArtifact,
        sourceSessionIDs,
      })

      if (!page) continue
      importedPages.push(page)

      const articleTopic = await upsertProposalTopic(payload, {
        focusTopic: inferredFocusTopic,
        generatedByID: Number(user.id),
        proposal: {
          confidence: articleProposal.confidence,
          kind: 'possible',
          relationship: 'related',
          sourceArtifacts: articleProposal.sourceArtifacts,
          sourceQueries: articleProposal.sourceQueries,
          sourceSessionIds: articleProposal.sourceSessionIds,
          summary: articleProposal.summary,
          title: articleProposal.title,
        },
        relatedPages: [page.id],
        requestSourceArtifact,
        sourceSessionIDs,
      })

      if (articleTopic) importedTopics.push(articleTopic)
    }

    if (inferredFocusTopic) {
      await payload.update({
        id: inferredFocusTopic.id,
        collection: 'wikiTopics',
        data: {
          lastExpandedAt: observedAt,
          relatedTopics: uniqueNumbers([
            ...relationIDs(inferredFocusTopic.relatedTopics),
            ...importedTopics.map((topic) => topic.id).filter((id) => id !== inferredFocusTopic.id),
          ]),
          sourceArtifacts: mergeSourceArtifacts(inferredFocusTopic.sourceArtifacts, requestSourceArtifact),
        },
        overrideAccess: true,
        user,
      })
    }

    return Response.json({
      articleCandidates: importedPages.map((page) => ({
        id: page.id,
        reviewStatus: page.reviewStatus,
        status: page._status,
        title: page.title,
      })),
      request: {
        artifactName: proposalArtifact.name,
        requestNumber,
        title: artifactsResult.request?.title,
        url: requestArtifactURL,
      },
      topicCandidates: importedTopics.map((topic) => ({
        id: topic.id,
        kind: topic.kind,
        reviewStatus: topic.reviewStatus,
        title: topic.title,
      })),
      warnings: proposal.warnings,
    })
  } catch (error) {
    const status = error instanceof PrismHookConfigError ? 503 : 502

    return Response.json(
      { message: error instanceof Error ? error.message : 'Prism proposal import failed.' },
      { status },
    )
  }
}

const upsertProposalTopic = async (
  payload: Payload,
  {
    focusTopic,
    generatedByID,
    proposal,
    relatedPages = [],
    requestSourceArtifact,
    sourceSessionIDs,
  }: {
    focusTopic: WikiTopic | null
    generatedByID: number
    proposal: ProposalTopic
    relatedPages?: number[]
    requestSourceArtifact: SourceArtifact
    sourceSessionIDs: number[]
  },
) => {
  const title = cleanTitle(proposal.title)
  if (!title) return null

  const existing = await findWikiTopicByTitle(payload, title)
  const observedAt = requestSourceArtifact.observedAt || new Date().toISOString()
  const sourceQueries = proposalSourceQueries(proposal.sourceQueries, title, observedAt)
  const sourceArtifacts = proposalSourceArtifacts(proposal.sourceArtifacts, requestSourceArtifact)
  const relatedTopicIDs = focusTopic ? [focusTopic.id] : []
  const parentTopic = parentTopicIDForProposal(proposal, focusTopic)

  if (existing) {
    return payload.update({
      id: existing.id,
      collection: 'wikiTopics',
      data: {
        generatedAt: existing.generatedAt || observedAt,
        generatedBy: existing.generatedBy || generatedByID,
        parentTopic: existing.parentTopic || parentTopic || undefined,
        relatedPages: uniqueNumbers([...relationIDs(existing.relatedPages), ...relatedPages]),
        relatedTopics: uniqueNumbers([
          ...relationIDs(existing.relatedTopics),
          ...relatedTopicIDs.filter((id) => id !== existing.id),
        ]),
        sourceArtifacts: mergeManySourceArtifacts(existing.sourceArtifacts, sourceArtifacts),
        sourceQueries: mergeSourceQueries(existing.sourceQueries, sourceQueries),
        sourceSessions: uniqueNumbers([...relationIDs(existing.sourceSessions), ...sourceSessionIDs]),
        summary: existing.summary || proposal.summary || proposal.rationale,
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'wikiTopics',
    data: {
      confidence: proposal.confidence || 'medium',
      generatedAt: observedAt,
      generatedBy: generatedByID,
      kind: proposal.kind || 'topic',
      parentTopic: parentTopic || undefined,
      relatedPages,
      relatedTopics: relatedTopicIDs,
      reviewStatus: 'suggested',
      sourceArtifacts,
      sourceQueries,
      sourceSessions: sourceSessionIDs,
      summary: proposal.summary || proposal.rationale || `Suggested by Prism expansion for ${focusTopic?.title || 'the wiki graph'}.`,
      title,
      visibility: 'member',
    },
    depth: 0,
    overrideAccess: true,
  })
}

const upsertProposalPage = async (
  payload: Payload,
  {
    externalLinks,
    focusTopic,
    proposal,
    requestSourceArtifact,
    sourceSessionIDs,
  }: {
    externalLinks: ProposalExternalLink[]
    focusTopic: WikiTopic | null
    proposal: ProposalArticle
    requestSourceArtifact: SourceArtifact
    sourceSessionIDs: number[]
  },
) => {
  const title = cleanTitle(proposal.title)
  if (!title) return null

  const existing = await findWikiPageByTitle(payload, title)
  const observedAt = requestSourceArtifact.observedAt || new Date().toISOString()
  const sourceArtifacts = proposalSourceArtifacts(proposal.sourceArtifacts, requestSourceArtifact)
  const possibleTopics = focusTopic ? [focusTopic.title] : []

  if (existing) {
    return payload.update({
      id: existing.id,
      collection: 'wikiPages',
      data: {
        possibleTopics: mergeTopicLabels(existing.possibleTopics, possibleTopics),
        sourceArtifacts: mergeManySourceArtifacts(existing.sourceArtifacts, sourceArtifacts),
        sourceSessions: uniqueNumbers([...relationIDs(existing.sourceSessions), ...sourceSessionIDs]),
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'wikiPages',
    data: {
      _status: 'draft',
      body: createCandidateBody(proposal, requestSourceArtifact),
      confidence: proposal.confidence || 'medium',
      furtherReading: externalLinks
        .filter((link) => (link.sourceType || 'external') !== 'paper' && (link.sourceType || 'external') !== 'tool')
        .map(linkRecord),
      generatedAt: observedAt,
      papers: externalLinks.filter((link) => link.sourceType === 'paper').map(linkRecord),
      possibleTopics: possibleTopics.map((topic) => ({ topic })),
      promptVersion: PROMPT_VERSION,
      reviewStatus: 'generated_draft',
      sourceArtifacts,
      sourceSessions: sourceSessionIDs,
      summary: proposal.summary || `Research candidate suggested by Prism for ${focusTopic?.title || 'the wiki graph'}.`,
      title,
      tools: externalLinks.filter((link) => link.sourceType === 'tool').map(linkRecord),
      visibility: 'member',
    },
    depth: 0,
    overrideAccess: true,
  })
}

const getTopic = async (payload: Payload, topicID: number): Promise<WikiTopic | null> => {
  try {
    return payload.findByID({
      id: topicID,
      collection: 'wikiTopics',
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

const findWikiTopicByTitle = async (payload: Payload, title: string): Promise<WikiTopic | null> => {
  const result = await payload.find({
    collection: 'wikiTopics',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      title: {
        equals: title,
      },
    },
  })

  return result.docs[0] || null
}

const findWikiPageByTitle = async (payload: Payload, title: string): Promise<WikiPage | null> => {
  const result = await payload.find({
    collection: 'wikiPages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      title: {
        equals: title,
      },
    },
  })

  return result.docs[0] || null
}

const findProposalArtifact = (
  artifacts: NonNullable<Awaited<ReturnType<typeof fetchPrismRequestArtifacts>>['artifacts']>,
) =>
  artifacts.find((artifact) => artifact.name === PROPOSAL_ARTIFACT_NAME) ||
  artifacts.find((artifact) => /wiki-topic-expansion-proposal/i.test(artifact.name || '')) ||
  artifacts.find((artifact) => artifact.name?.endsWith('.json') && artifact.content?.body)

const parseProposal = (text: string): Proposal => {
  const parsed = JSON.parse(text) as Partial<Proposal>

  return {
    articleCandidates: Array.isArray(parsed.articleCandidates) ? parsed.articleCandidates : [],
    externalLinks: Array.isArray(parsed.externalLinks) ? parsed.externalLinks : [],
    focusTopic: parsed.focusTopic,
    mode: parsed.mode,
    suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((item): item is string => typeof item === 'string') : [],
  }
}

const proposalSourceArtifacts = (
  proposalArtifacts: ProposalSourceArtifact[] | undefined,
  requestSourceArtifact: SourceArtifact,
) => {
  const artifacts = [requestSourceArtifact]

  for (const artifact of proposalArtifacts || []) {
    if (!artifact.label && !artifact.url && !artifact.artifactID) continue
    artifacts.push({
      artifactID: artifact.artifactID,
      label: artifact.label || artifact.url || artifact.artifactID || 'Prism source',
      observedAt: requestSourceArtifact.observedAt,
      sourceType: 'prism',
      url: artifact.url,
    })
  }

  return artifacts
}

const proposalSourceQueries = (queries: string[] | undefined, title: string, searchedAt: string) =>
  (queries?.length ? queries : [title])
    .filter((query): query is string => typeof query === 'string' && query.trim().length > 0)
    .map((query) => ({
      query: query.trim(),
      searchedAt,
    }))

const proposalSourceSessionIDs = (proposal: Proposal) =>
  uniqueNumbers([
    ...proposal.suggestedTopics.flatMap((topic) => numberValues(topic.sourceSessionIds)),
    ...proposal.articleCandidates.flatMap((article) => numberValues(article.sourceSessionIds)),
  ])

const parentTopicIDForProposal = (proposal: ProposalTopic, focusTopic: WikiTopic | null) => {
  if (!focusTopic) return null
  if (proposal.relationship === 'child') return focusTopic.id
  if (proposal.relationship === 'sibling') return relationID(focusTopic.parentTopic)
  return null
}

const createCandidateBody = (
  candidate: Pick<ProposalArticle, 'researchSlots' | 'summary' | 'title'>,
  sourceArtifact: SourceArtifact,
): WikiPage['body'] => ({
  root: {
    children: [
      lexicalHeading('Research candidate'),
      lexicalParagraph(candidate.summary || `Research candidate for ${candidate.title || 'this topic'}.`),
      lexicalParagraph('This draft was created from a Prism topic expansion proposal and needs source-backed research before publication.'),
      lexicalHeading('Research slots'),
      lexicalList(candidate.researchSlots?.length ? candidate.researchSlots : [candidate.title || 'Source-backed research']),
      lexicalHeading('Source'),
      lexicalParagraph(`${sourceArtifact.label}${sourceArtifact.url ? `: ${sourceArtifact.url}` : ''}`),
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const lexicalHeading = (text: string) => ({
  children: [lexicalText(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  tag: 'h2',
  type: 'heading',
  version: 1,
})

const lexicalParagraph = (text: string) => ({
  children: [lexicalText(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  type: 'paragraph',
  version: 1,
})

const lexicalList = (items: string[]) => ({
  children: items.map((item, index) => ({
    children: [lexicalText(item)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'listitem',
    value: index + 1,
    version: 1,
  })),
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  type: 'list',
  version: 1,
})

const lexicalText = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const mergeManySourceArtifacts = (
  existing: SourceArtifact[] | null | undefined,
  next: SourceArtifact[],
): SourceArtifact[] => next.reduce((artifacts, artifact) => mergeSourceArtifacts(artifacts, artifact), existing || [])

const mergeSourceArtifacts = (
  existing: SourceArtifact[] | null | undefined,
  next: SourceArtifact,
): SourceArtifact[] => {
  const artifacts = [...(existing || [])]
  const key = artifactKey(next)

  if (!artifacts.some((artifact) => artifactKey(artifact) === key)) {
    artifacts.push(next)
  }

  return artifacts.map(({ artifactID, label, observedAt, sourceQuery, sourceType, url }) => ({
    artifactID,
    label,
    observedAt,
    sourceQuery,
    sourceType,
    url,
  }))
}

const mergeSourceQueries = (
  existing: WikiTopic['sourceQueries'],
  next: NonNullable<WikiTopic['sourceQueries']>,
) => {
  const queries = [...(existing || [])]
  const existingQueries = new Set(queries.map((item) => item.query.toLowerCase()))

  for (const query of next) {
    if (!existingQueries.has(query.query.toLowerCase())) queries.push(query)
  }

  return queries.map(({ filters, query, resultCount, searchedAt }) => ({
    filters,
    query,
    resultCount,
    searchedAt,
  }))
}

const mergeTopicLabels = (
  existing: WikiPage['possibleTopics'],
  nextTopics: string[],
): WikiPage['possibleTopics'] => {
  const topics = [...(existing || [])]
  const existingTopics = new Set(topics.map((item) => item.topic.toLowerCase()))

  for (const topic of nextTopics) {
    if (!existingTopics.has(topic.toLowerCase())) topics.push({ topic })
  }

  return topics.map(({ topic }) => ({ topic }))
}

const linkRecord = (link: ProposalExternalLink) => ({
  label: link.label || link.url || 'Untitled link',
  note: link.note,
  url: link.url,
})

const relationIDs = (items?: (number | { id: number })[] | null): number[] =>
  (items || [])
    .map((item) => (typeof item === 'number' ? item : item.id))
    .filter((id): id is number => Number.isSafeInteger(id))

const relationID = (item?: number | { id: number } | null) =>
  typeof item === 'number' ? item : item?.id || null

const uniqueNumbers = (items: number[]): number[] => Array.from(new Set(items))

const artifactKey = (artifact: Pick<SourceArtifact, 'artifactID' | 'label' | 'url'>): string =>
  artifact.url || artifact.artifactID || artifact.label

const cleanTitle = (title: unknown): string =>
  typeof title === 'string' ? title.replace(/\s+/g, ' ').trim() : ''

const numberValues = (items: unknown): number[] =>
  Array.isArray(items) ? items.map(numberValue).filter((value): value is number => Boolean(value)) : []

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

const requestNumberFromURL = (value: unknown) => {
  if (typeof value !== 'string') return null

  const match = value.match(/\/requests\/by-number\/(\d+)\/artifacts/)
  if (!match) return null

  return numberValue(match[1])
}
