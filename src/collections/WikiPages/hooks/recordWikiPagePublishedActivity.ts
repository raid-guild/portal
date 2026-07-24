import type { CollectionAfterChangeHook } from 'payload'

import { toActivityVisibility } from '@/activityItems/activityVisibility'
import {
  normalizeRelationshipIDs,
  recordPortalActivity,
} from '@/activityItems/recordPortalActivity'
import type { WikiPage } from '@/payload-types'

export const recordWikiPagePublishedActivity: CollectionAfterChangeHook<WikiPage> = async ({
  context,
  doc,
  req,
}) => {
  if (context.skipActivityHooks) return doc
  if (doc._status !== 'published' || doc.reviewStatus !== 'reviewed') return doc

  const visibility = toActivityVisibility(doc.visibility)
  if (!visibility) return doc

  const relatedProjects = normalizeRelationshipIDs(doc.relatedProjects)
  const relatedThreads = normalizeRelationshipIDs(doc.relatedThreads)

  try {
    await recordPortalActivity({
      activityType: 'contribution',
      body: doc.summary,
      happenedAt: doc.publishedAt || doc.lastReviewedAt,
      relatedProfiles: doc.relatedProfiles,
      relatedProject: relatedProjects[0],
      relatedThread: relatedThreads[0],
      req,
      sourceKey: `wikiPage:${doc.id}:published`,
      sourceLabel: 'Portal wiki',
      title: `Reviewed wiki page: ${doc.title}`,
      visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: 'Failed to record wiki page published activity.',
      wikiPageID: doc.id,
    })
  }

  return doc
}
