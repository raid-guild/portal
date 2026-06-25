import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import { hasRole } from '@/access/roles'
import type { Event, WikiPage, WikiTopic } from '@/payload-types'

type ImportBody = {
  eventID?: unknown
  resourceLabel?: unknown
  resourceURL?: unknown
}

type Candidate = {
  confidence: 'low' | 'medium' | 'high'
  researchSlots: string[]
  summary: string
  title: string
}

type TopicMap = {
  articleCandidates: Candidate[]
  topicCandidates: Candidate[]
  warnings: string[]
}

type SourceArtifact = NonNullable<WikiTopic['sourceArtifacts']>[number]

const TOPIC_MAP_PROMPT_VERSION = 'topic-map-import-v1'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to import a topic map.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'agent', 'member'])) {
    return Response.json(
      { message: 'A member account is required to import session topic maps.' },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => null)) as ImportBody | null
  const eventID = numberValue(body?.eventID)

  if (!eventID) {
    return Response.json({ message: 'Provide an eventID.' }, { status: 400 })
  }

  const event = await getEvent(payload, eventID)

  if (!event) {
    return Response.json({ message: 'No matching session found.' }, { status: 404 })
  }

  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])
  if (event.visibility === 'admin' && !canManageWiki) {
    return Response.json(
      { message: 'You do not have permission to import from this session.' },
      { status: 403 },
    )
  }

  const resource = selectTopicMapResource({
    event,
    resourceLabel: stringValue(body?.resourceLabel),
    resourceURL: stringValue(body?.resourceURL),
  })

  if (!resource) {
    return Response.json(
      { message: 'Choose a topic-map artifact from the session resources.' },
      { status: 400 },
    )
  }

  const artifactText = await fetchArtifactText(resource.url)
  const topicMap = parseTopicMap(artifactText, event.title)
  const observedAt = new Date().toISOString()
  const sourceArtifact = createSourceArtifact({
    label: resource.label,
    observedAt,
    sourceQuery: `Topic map import for ${event.title}`,
    url: resource.url,
  })

  const importedTopics: WikiTopic[] = []
  const importedPages: WikiPage[] = []

  for (const candidate of topicMap.topicCandidates) {
    const topic = await upsertWikiTopic(payload, {
      candidate,
      eventID,
      generatedByID: Number(user.id),
      kind: 'topic',
      relatedPages: [],
      relatedTopics: [],
      sourceArtifact,
    })

    importedTopics.push(topic)
  }

  const broadTopicIDs = importedTopics.map((topic) => topic.id)

  for (const candidate of topicMap.articleCandidates) {
    const page = await upsertWikiPage(payload, {
      candidate,
      eventID,
      sourceArtifact,
      topicTitles: topicMap.topicCandidates.map((topic) => topic.title),
    })

    importedPages.push(page)

    const articleTopic = await upsertWikiTopic(payload, {
      candidate,
      eventID,
      generatedByID: Number(user.id),
      kind: 'possible',
      relatedPages: [page.id],
      relatedTopics: broadTopicIDs,
      sourceArtifact,
    })

    importedTopics.push(articleTopic)
  }

  return Response.json({
    articleCandidates: importedPages.map((page) => ({
      id: page.id,
      reviewStatus: page.reviewStatus,
      status: page._status,
      title: page.title,
    })),
    event: {
      id: event.id,
      title: event.title,
    },
    resource,
    topicCandidates: importedTopics.map((topic) => ({
      id: topic.id,
      kind: topic.kind,
      reviewStatus: topic.reviewStatus,
      title: topic.title,
    })),
    warnings: topicMap.warnings,
  })
}

const getEvent = async (payload: Payload, eventID: number): Promise<Event | null> => {
  try {
    return await payload.findByID({
      collection: 'events',
      depth: 0,
      id: eventID,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

const upsertWikiTopic = async (
  payload: Payload,
  {
    candidate,
    eventID,
    generatedByID,
    kind,
    relatedPages,
    relatedTopics,
    sourceArtifact,
  }: {
    candidate: Candidate
    eventID: number
    generatedByID: number
    kind: 'possible' | 'topic'
    relatedPages: number[]
    relatedTopics: number[]
    sourceArtifact: SourceArtifact
  },
): Promise<WikiTopic> => {
  const existing = await findWikiTopicByTitle(payload, candidate.title)
  const sourceQueries = candidate.researchSlots.length
    ? candidate.researchSlots.map((slot) => ({
        query: slot,
        searchedAt: sourceArtifact.observedAt,
      }))
    : [{ query: candidate.title, searchedAt: sourceArtifact.observedAt }]

  if (existing) {
    return payload.update({
      collection: 'wikiTopics',
      data: {
        generatedAt: existing.generatedAt || sourceArtifact.observedAt,
        generatedBy: existing.generatedBy || generatedByID,
        relatedPages: uniqueNumbers([...relationIDs(existing.relatedPages), ...relatedPages]),
        relatedTopics: uniqueNumbers([
          ...relationIDs(existing.relatedTopics),
          ...relatedTopics.filter((id) => id !== existing.id),
        ]),
        sourceArtifacts: mergeSourceArtifacts(existing.sourceArtifacts, sourceArtifact),
        sourceQueries: mergeSourceQueries(existing.sourceQueries, sourceQueries),
        sourceSessions: uniqueNumbers([...relationIDs(existing.sourceSessions), eventID]),
        summary: existing.summary || candidate.summary,
      },
      depth: 0,
      id: existing.id,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'wikiTopics',
    data: {
      confidence: candidate.confidence,
      generatedAt: sourceArtifact.observedAt,
      generatedBy: generatedByID,
      kind,
      relatedPages,
      relatedTopics,
      reviewStatus: 'suggested',
      sourceArtifacts: [sourceArtifact],
      sourceQueries,
      sourceSessions: [eventID],
      summary: candidate.summary,
      title: candidate.title,
      visibility: 'member',
    },
    depth: 0,
    overrideAccess: true,
  })
}

const upsertWikiPage = async (
  payload: Payload,
  {
    candidate,
    eventID,
    sourceArtifact,
    topicTitles,
  }: {
    candidate: Candidate
    eventID: number
    sourceArtifact: SourceArtifact
    topicTitles: string[]
  },
): Promise<WikiPage> => {
  const existing = await findWikiPageByTitle(payload, candidate.title)

  if (existing) {
    return payload.update({
      collection: 'wikiPages',
      data: {
        possibleTopics: mergeTopicLabels(existing.possibleTopics, topicTitles),
        sourceArtifacts: mergeSourceArtifacts(existing.sourceArtifacts, sourceArtifact),
        sourceSessions: uniqueNumbers([...relationIDs(existing.sourceSessions), eventID]),
      },
      depth: 0,
      id: existing.id,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'wikiPages',
    data: {
      _status: 'draft',
      body: createCandidateBody(candidate, sourceArtifact),
      confidence: candidate.confidence,
      generatedAt: sourceArtifact.observedAt,
      promptVersion: TOPIC_MAP_PROMPT_VERSION,
      possibleTopics: topicTitles.map((topic) => ({ topic })),
      reviewStatus: 'generated_draft',
      sourceArtifacts: [sourceArtifact],
      sourceSessions: [eventID],
      summary: candidate.summary,
      title: candidate.title,
      visibility: 'member',
    },
    depth: 0,
    overrideAccess: true,
  })
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

const selectTopicMapResource = ({
  event,
  resourceLabel,
  resourceURL,
}: {
  event: Event
  resourceLabel: string
  resourceURL: string
}): { label: string; url: string } | null => {
  const resources = [
    ...(event.resources || []).map((resource) => ({
      label: resource.label,
      url: resource.url,
    })),
    {
      label: 'Source artifact',
      url: event.sourceArtifactURL,
    },
    {
      label: 'Summary artifact',
      url: event.summaryArtifactURL,
    },
    {
      label: 'Transcript artifact',
      url: event.transcriptArtifactURL,
    },
  ].filter((resource): resource is { label: string; url: string } =>
    Boolean(resource.label && resource.url),
  )

  if (resourceURL) {
    return resources.find((resource) => resource.url === resourceURL) || null
  }

  if (resourceLabel) {
    const normalizedLabel = resourceLabel.toLowerCase()

    return (
      resources.find((resource) => resource.label.toLowerCase() === normalizedLabel) ||
      resources.find((resource) => resource.label.toLowerCase().includes(normalizedLabel)) ||
      null
    )
  }

  return (
    resources.find((resource) => /topic[- ]?map/i.test(resource.label)) ||
    resources.find((resource) => /topic[- ]?map/i.test(resource.url)) ||
    null
  )
}

const fetchArtifactText = async (url: string): Promise<string> => {
  const response = await fetchArtifactURL(toRawArtifactURL(url))

  if (!response.ok && toRawArtifactURL(url) !== url) {
    const fallbackResponse = await fetchArtifactURL(url)

    if (fallbackResponse.ok) return responseText(fallbackResponse)
  }

  if (!response.ok) {
    throw new Error(`Topic map artifact returned ${response.status}.`)
  }

  return responseText(response)
}

const fetchArtifactURL = (url: string) =>
  fetch(url, {
    headers: {
      accept: 'text/plain,text/markdown,text/html,application/json',
    },
  })

const responseText = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(text)
      return String(parsed.content || parsed.text || parsed.body || text)
    } catch {
      return text
    }
  }

  return extractPreText(text) || text
}

const toRawArtifactURL = (url: string): string => {
  const match = url.match(/^(https?:\/\/[^/]+)\/artifacts\/([^/?#]+)/)

  if (!match) return url

  return `${match[1]}/api/artifacts/${match[2]}/raw`
}

const parseTopicMap = (text: string, eventTitle: string): TopicMap => {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const topicCandidates: Candidate[] = []
  const articleCandidates: Candidate[] = []
  const warnings: string[] = []
  let currentSection: 'articles' | 'deferred' | 'topics' | null = null
  let currentCandidate: Candidate | null = null

  const finishCandidate = () => {
    if (!currentCandidate || !currentSection) return

    currentCandidate.summary ||= defaultSummary(currentCandidate, eventTitle)

    if (currentSection === 'topics') {
      topicCandidates.push(currentCandidate)
    }

    if (currentSection === 'articles') {
      articleCandidates.push(currentCandidate)
    }

    currentCandidate = null
  }

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/)

    if (heading) {
      finishCandidate()
      const normalizedHeading = heading[1].toLowerCase()

      if (/broad.*wiki|wiki candidates|topic candidates/.test(normalizedHeading)) {
        currentSection = 'topics'
      } else if (
        /narrow.*(blog|article)|blog candidates|article candidates/.test(normalizedHeading)
      ) {
        currentSection = 'articles'
      } else if (/deferred|blocked/.test(normalizedHeading)) {
        currentSection = 'deferred'
      } else {
        currentSection = null
      }

      continue
    }

    const numbered = line.match(/^\s*\d+\.\s+(.+?)\s*$/)
    if (numbered) {
      finishCandidate()

      if (currentSection === 'topics' || currentSection === 'articles') {
        currentCandidate = {
          confidence: 'medium',
          researchSlots: [],
          summary: '',
          title: cleanCandidateTitle(numbered[1]),
        }
      }

      continue
    }

    const bullet = line.match(/^\s*-\s+(.+?)\s*$/)
    if (!bullet) continue

    if (currentSection === 'deferred') {
      warnings.push(bullet[1].trim())
      continue
    }

    if (!currentCandidate) continue

    const keyed = bullet[1].match(/^([^:]+):\s*(.+)$/)

    if (!keyed) continue

    const key = keyed[1].trim().toLowerCase()
    const value = keyed[2].trim()

    if (key === 'research slots') {
      currentCandidate.researchSlots = value
        .split(',')
        .map((slot) => slot.trim())
        .filter(Boolean)
    }

    if (key === 'thesis') {
      currentCandidate.summary = value
    }

    if (key === 'source strength') {
      currentCandidate.confidence = confidenceFromSourceStrength(value)
    }
  }

  finishCandidate()

  return {
    articleCandidates: uniqueCandidates(articleCandidates),
    topicCandidates: uniqueCandidates(topicCandidates),
    warnings,
  }
}

const createSourceArtifact = ({
  label,
  observedAt,
  sourceQuery,
  url,
}: {
  label: string
  observedAt: string
  sourceQuery: string
  url: string
}): SourceArtifact => ({
  artifactID: extractArtifactID(url),
  label,
  observedAt,
  sourceQuery,
  sourceType: 'prism',
  url,
})

const createCandidateBody = (
  candidate: Candidate,
  sourceArtifact: SourceArtifact,
): WikiPage['body'] => ({
  root: {
    children: [
      lexicalHeading('Research candidate'),
      lexicalParagraph(candidate.summary),
      lexicalParagraph(
        `This draft was created from a session topic-map artifact and needs source-backed research before publication.`,
      ),
      lexicalHeading('Research slots'),
      lexicalList(candidate.researchSlots.length ? candidate.researchSlots : [candidate.title]),
      lexicalHeading('Source'),
      lexicalParagraph(
        `${sourceArtifact.label}${sourceArtifact.url ? `: ${sourceArtifact.url}` : ''}`,
      ),
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

const relationIDs = (items?: (number | { id: number })[] | null): number[] =>
  (items || [])
    .map((item) => (typeof item === 'number' ? item : item.id))
    .filter((id): id is number => Number.isSafeInteger(id))

const uniqueNumbers = (items: number[]): number[] => Array.from(new Set(items))

const uniqueCandidates = (candidates: Candidate[]): Candidate[] => {
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    const key = candidate.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return Boolean(candidate.title)
  })
}

const confidenceFromSourceStrength = (value: string): Candidate['confidence'] => {
  if (/high/i.test(value)) return 'high'
  if (/low|blocked|unverified|needs verification/i.test(value)) return 'low'
  return 'medium'
}

const defaultSummary = (candidate: Candidate, eventTitle: string): string => {
  if (candidate.researchSlots.length) {
    return `Suggested from ${eventTitle}. Research slots: ${candidate.researchSlots.join(', ')}.`
  }

  return `Suggested from ${eventTitle}.`
}

const cleanCandidateTitle = (title: string): string =>
  title
    .replace(/\s+/g, ' ')
    .replace(/\s+[-–—]\s+.*$/, '')
    .trim()

const artifactKey = (artifact: Pick<SourceArtifact, 'artifactID' | 'label' | 'url'>): string =>
  artifact.url || artifact.artifactID || artifact.label

const extractArtifactID = (url: string): string | undefined =>
  url.match(/\/(?:api\/)?artifacts\/([^/?#]+)/)?.[1]

const extractPreText = (text: string): string => {
  const pre = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)?.[1]

  return pre ? decodeHTML(pre) : ''
}

const decodeHTML = (text: string): string =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const stringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}
