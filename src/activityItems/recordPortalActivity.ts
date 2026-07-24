import type { PayloadRequest } from 'payload'

import type { ActivityItem } from '@/payload-types'

type RelationshipValue = { id?: number | string } | number | string | null | undefined

type RecordPortalActivityArgs = {
  activityType: ActivityItem['activityType']
  body?: string | null
  creditedProfiles?: RelationshipValue[] | null
  happenedAt?: string | Date | null
  relatedEvent?: RelationshipValue
  relatedProfiles?: RelationshipValue[] | null
  relatedProject?: RelationshipValue
  relatedThread?: RelationshipValue
  req: Pick<PayloadRequest, 'payload' | 'user'>
  sourceKey: string
  sourceLabel?: string | null
  sourceURL?: string | null
  title: string
  visibility?: ActivityItem['visibility']
}

export const recordPortalActivity = async ({
  activityType,
  body,
  creditedProfiles,
  happenedAt,
  relatedEvent,
  relatedProfiles,
  relatedProject,
  relatedThread,
  req,
  sourceKey,
  sourceLabel,
  sourceURL,
  title,
  visibility = 'authenticated',
}: RecordPortalActivityArgs): Promise<ActivityItem | null> => {
  const actorProfileIDs = await getProfileIDsForUser(req)
  const explicitCreditIDs = normalizeRelationshipIDs(creditedProfiles)
  const creditedProfileIDs = uniqueIDs([...explicitCreditIDs, ...actorProfileIDs])
  const relatedProfileIDs = uniqueIDs([
    ...normalizeRelationshipIDs(relatedProfiles),
    ...creditedProfileIDs,
  ])

  const data = {
    activityType,
    body: body || undefined,
    creditedProfiles: creditedProfileIDs,
    happenedAt: normalizeDate(happenedAt),
    relatedEvent: getRelationshipID(relatedEvent),
    relatedProfiles: relatedProfileIDs,
    relatedProject: getRelationshipID(relatedProject),
    relatedThread: getRelationshipID(relatedThread),
    sourceKey,
    sourceLabel: sourceLabel || 'Portal action',
    sourceURL: sourceURL || undefined,
    title,
    visibility,
    _status: 'published' as const,
  }

  const existing = await req.payload.find({
    collection: 'activityItems',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      sourceKey: {
        equals: sourceKey,
      },
    },
  })

  if (existing.docs[0]) {
    return req.payload.update({
      id: existing.docs[0].id,
      collection: 'activityItems',
      context: {
        disableRevalidate: true,
        disableSearchSync: true,
      },
      data,
      depth: 0,
      overrideAccess: true,
      req,
      user: req.user,
    })
  }

  return req.payload.create({
    collection: 'activityItems',
    context: {
      disableRevalidate: true,
      disableSearchSync: true,
    },
    data,
    depth: 0,
    overrideAccess: true,
    req,
    user: req.user,
  })
}

export const getRelationshipID = (value: RelationshipValue): number | undefined => {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : undefined
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isSafeInteger(parsed) ? parsed : undefined
  }

  if (value && typeof value === 'object') {
    const id = value.id

    return getRelationshipID(id)
  }

  return undefined
}

export const normalizeRelationshipIDs = (values?: RelationshipValue[] | null): number[] => {
  if (!Array.isArray(values)) return []

  return values.flatMap((value) => {
    const id = getRelationshipID(value)
    return id === undefined ? [] : [id]
  })
}

const uniqueIDs = (values: number[]) => {
  const ids = new Map<number, number>()

  values.forEach((value) => {
    ids.set(value, value)
  })

  return [...ids.values()]
}

const normalizeDate = (value?: string | Date | null) => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value) return value

  return new Date().toISOString()
}

const getProfileIDsForUser = async (
  req: Pick<PayloadRequest, 'payload' | 'user'>,
): Promise<number[]> => {
  if (!req.user?.id) return []

  const profiles = await req.payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      user: {
        equals: req.user.id,
      },
    },
  })

  return profiles.docs.map((profile) => profile.id)
}
