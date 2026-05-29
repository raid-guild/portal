import type { PayloadRequest } from 'payload'

import type { Notification, NotificationPreference, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

type ChannelPreference = 'email' | 'in_app' | 'muted'

type PreferenceKey =
  | 'badgeAwards'
  | 'briefs'
  | 'sessionAnnouncements'
  | 'sessionReminders'
  | 'weeklyDigest'

type Visibility = 'admin' | 'authenticated' | 'member' | 'private' | 'public'

type NotificationIntent = Pick<
  Notification,
  | 'actionLabel'
  | 'actionURL'
  | 'body'
  | 'metadata'
  | 'priority'
  | 'relatedBadgeAward'
  | 'relatedBrief'
  | 'relatedEvent'
  | 'title'
  | 'type'
>

type CreateNotificationForUserArgs = {
  data: NotificationIntent
  dedupeKey: string
  preferenceKey: PreferenceKey
  req: PayloadRequest
  user: User
}

type CreateNotificationsForEligibleUsersArgs = {
  buildNotification: (user: User) => {
    data: NotificationIntent
    dedupeKey: string
  }
  preferenceKey: PreferenceKey
  req: PayloadRequest
  visibility?: Visibility | null
}

const DEFAULT_PREFERENCES: Record<PreferenceKey, ChannelPreference> = {
  badgeAwards: 'in_app',
  briefs: 'in_app',
  sessionAnnouncements: 'in_app',
  sessionReminders: 'in_app',
  weeklyDigest: 'in_app',
}

const userCanReceiveVisibility = (user: User, visibility?: Visibility | null) => {
  if (!visibility || visibility === 'admin' || visibility === 'private') return false
  if (visibility === 'public' || visibility === 'authenticated') return isHumanUser(user)

  return isHumanUser(user) && hasAnyRole(user, ['admin', 'editor', 'contributor', 'member'])
}

export const createNotificationForUser = async ({
  data,
  dedupeKey,
  preferenceKey,
  req,
  user,
}: CreateNotificationForUserArgs) => {
  if (!isHumanUser(user)) return null

  const channel = await getDeliveryChannel({ preferenceKey, req, user })
  if (channel === 'muted') return null

  const existing = await req.payload.find({
    collection: 'notifications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      dedupeKey: {
        equals: dedupeKey,
      },
    },
  })

  if (existing.docs.length) return existing.docs[0]

  return req.payload.create({
    collection: 'notifications',
    data: {
      ...data,
      actionURL: normalizeActionURL(data.actionURL),
      dedupeKey,
      deliveryChannel: channel,
      emailStatus: channel === 'email' ? 'pending' : 'none',
      recipient: user.id,
      status: 'unread',
    },
    overrideAccess: true,
    req,
  })
}

export const createNotificationsForEligibleUsers = async ({
  buildNotification,
  preferenceKey,
  req,
  visibility,
}: CreateNotificationsForEligibleUsersArgs) => {
  if (!visibility || visibility === 'admin' || visibility === 'private') return

  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const users = await req.payload.find({
      collection: 'users',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
      req,
    })

    for (const user of users.docs) {
      if (!userCanReceiveVisibility(user, visibility)) continue

      const intent = buildNotification(user)
      await createNotificationForUser({
        data: intent.data,
        dedupeKey: intent.dedupeKey,
        preferenceKey,
        req,
        user,
      })
    }

    hasNextPage = Boolean(users.hasNextPage)
    page += 1
  }
}

export const getRelationshipID = (value: unknown): number | string | undefined => {
  if (!value) return undefined
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id
    return id || undefined
  }

  return undefined
}

const getDeliveryChannel = async ({
  preferenceKey,
  req,
  user,
}: {
  preferenceKey: PreferenceKey
  req: PayloadRequest
  user: User
}): Promise<ChannelPreference> => {
  const preferences = await getPreferences({ req, userID: user.id })
  const preferredChannel = preferences?.[preferenceKey] || DEFAULT_PREFERENCES[preferenceKey]

  if (preferredChannel !== 'email') return preferredChannel

  return preferences?.emailEnabled && user.emailVerifiedAt ? 'email' : 'in_app'
}

const getPreferences = async ({
  req,
  userID,
}: {
  req: PayloadRequest
  userID: number | string
}): Promise<NotificationPreference | null> => {
  const preferences = await req.payload.find({
    collection: 'notificationPreferences',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return preferences.docs[0] || null
}

const hasAnyRole = (user: User, roles: string[]) =>
  Array.isArray(user.roles) && user.roles.some((role) => roles.includes(role))

const isHumanUser = (user: User) => !hasAnyRole(user, ['agent'])

const normalizeActionURL = (url?: null | string) => {
  if (!url) return undefined
  if (url.startsWith('/')) return url

  try {
    const parsed = new URL(url)
    const serverURL = new URL(getServerSideURL())

    return parsed.origin === serverURL.origin ? `${parsed.pathname}${parsed.search}` : url
  } catch {
    return url
  }
}
