import type { CollectionAfterChangeHook } from 'payload'

import { toActivityVisibility } from '@/activityItems/activityVisibility'
import { recordPortalActivity } from '@/activityItems/recordPortalActivity'
import type { Event } from '@/payload-types'

export const recordEventPublishedActivity: CollectionAfterChangeHook<Event> = async ({
  context,
  doc,
  req,
}) => {
  if (context.skipActivityHooks) return doc
  if (doc._status !== 'published') return doc

  const visibility = toActivityVisibility(doc.visibility)
  if (!visibility) return doc

  try {
    await recordPortalActivity({
      activityType: 'event',
      body: doc.summary || undefined,
      happenedAt: doc.publishedAt,
      relatedEvent: doc.id,
      relatedProfiles: [doc.speaker, ...(doc.hostProfiles || []), ...(doc.speakerProfiles || [])],
      req,
      sourceKey: `event:${doc.id}:published`,
      sourceLabel: 'Portal session',
      title: `Scheduled session: ${doc.title}`,
      visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      eventID: doc.id,
      msg: 'Failed to record event published activity.',
    })
  }

  return doc
}
