import type { CollectionAfterChangeHook } from 'payload'

import type { Badge, ProfileBadge } from '@/payload-types'
import { createNotificationForUser, getRelationshipID } from '@/notifications/createNotification'

export const createBadgeAwardedNotifications: CollectionAfterChangeHook<ProfileBadge> = async ({
  context,
  doc,
  operation,
  req,
}) => {
  if (context.skipNotificationHooks) return doc
  if (operation !== 'create') return doc
  if (doc.visibility === 'private') return doc

  const badge = await getBadge({ badge: doc.badge, req })
  const profileIDs = Array.isArray(doc.profiles)
    ? doc.profiles.map(getRelationshipID).filter((id): id is number | string => Boolean(id))
    : []

  for (const profileID of profileIDs) {
    try {
      const profile = await req.payload.findByID({
        id: profileID,
        collection: 'profiles',
        depth: 0,
        overrideAccess: true,
        req,
      })
      const userID = getRelationshipID(profile.user)

      if (!userID) continue

      const user = await req.payload.findByID({
        id: userID,
        collection: 'users',
        depth: 0,
        overrideAccess: true,
        req,
      })

      await createNotificationForUser({
        data: {
          actionLabel: 'View profile',
          actionURL: `/members/${profile.handle}`,
          body: doc.note || badge.description || undefined,
          priority: 'normal',
          relatedBadgeAward: doc.id,
          title: `Badge awarded: ${badge.title}`,
          type: 'badge_awarded',
        },
        dedupeKey: `badge-award:${doc.id}:profile:${profileID}:user:${user.id}`,
        preferenceKey: 'badgeAwards',
        req,
        user,
      })
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: 'Failed to create badge awarded notification for profile.',
        profileBadgeID: doc.id,
        profileID,
      })
    }
  }

  return doc
}

const getBadge = async ({
  badge,
  req,
}: {
  badge: Badge | number | string
  req: Parameters<CollectionAfterChangeHook<ProfileBadge>>[0]['req']
}) => {
  if (typeof badge === 'object') return badge

  return req.payload.findByID({
    id: badge,
    collection: 'badges',
    depth: 0,
    overrideAccess: true,
    req,
  })
}
