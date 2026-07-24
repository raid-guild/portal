import type { CollectionAfterChangeHook } from 'payload'

import { toActivityVisibility } from '@/activityItems/activityVisibility'
import { recordPortalActivity } from '@/activityItems/recordPortalActivity'
import type { Post } from '@/payload-types'

export const recordPostPublishedActivity: CollectionAfterChangeHook<Post> = async ({
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
      activityType: 'contribution',
      body: doc.meta?.description || undefined,
      happenedAt: doc.publishedAt,
      relatedEvent: doc.sourceSession,
      relatedThread: doc.parentThread,
      req,
      sourceKey: `post:${doc.id}:published`,
      sourceLabel: 'Portal post',
      title: `Published post: ${doc.title}`,
      visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: 'Failed to record post published activity.',
      postID: doc.id,
    })
  }

  return doc
}
