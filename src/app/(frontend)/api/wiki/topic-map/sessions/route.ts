import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import type { Event } from '@/payload-types'

type TopicMapResource = {
  label: string
  type: string
  url: string
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to browse topic-map sessions.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'agent', 'member'])) {
    return Response.json(
      { message: 'A member account is required to browse topic-map sessions.' },
      { status: 403 },
    )
  }

  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])
  const result = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: '-startsAt',
    where: canManageWiki
      ? undefined
      : {
          visibility: {
            not_equals: 'admin',
          },
        },
  })

  const sessions = result.docs
    .map((event) => ({
      id: event.id,
      resources: topicMapResources(event),
      startsAt: event.startsAt,
      title: event.title,
      visibility: event.visibility,
    }))
    .filter((event) => event.resources.length > 0)

  return Response.json({ sessions })
}

const topicMapResources = (event: Event): TopicMapResource[] => {
  const resources: TopicMapResource[] = []

  for (const resource of event.resources || []) {
    if (isTopicMapResource(resource.label, resource.url)) {
      resources.push({
        label: resource.label,
        type: resource.resourceType || 'artifact',
        url: resource.url,
      })
    }
  }

  for (const resource of [
    {
      label: 'Source artifact',
      type: 'artifact',
      url: event.sourceArtifactURL,
    },
    {
      label: 'Summary artifact',
      type: 'artifact',
      url: event.summaryArtifactURL,
    },
  ]) {
    const url = resource.url

    if (url && isTopicMapResource(resource.label, url)) {
      resources.push({
        label: resource.label,
        type: resource.type,
        url,
      })
    }
  }

  return dedupeResources(resources)
}

const isTopicMapResource = (label: string, url: string): boolean =>
  /topic[- ]?map/i.test(label) || /topic[-_]?map|prism-workflow/i.test(url)

const dedupeResources = (resources: TopicMapResource[]): TopicMapResource[] => {
  const seen = new Set<string>()

  return resources.filter((resource) => {
    if (seen.has(resource.url)) return false
    seen.add(resource.url)
    return true
  })
}
