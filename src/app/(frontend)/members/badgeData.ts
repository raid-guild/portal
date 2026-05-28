import type { Payload } from 'payload'

import type { User } from '@/payload-types'

export type BadgeSummary = {
  category?: string | null
  description?: string | null
  displayStyle?: string | null
  id: number | string
  slug?: string | null
  title: string
}

type BadgeAward = {
  badge?: BadgeSummary | number | string | null
  featured?: boolean | null
  profiles?: ({ id?: number | string } | number | string)[] | null
}

export const getBadgeSummariesByProfile = async ({
  payload,
  profileIDs,
  user,
}: {
  payload: Payload
  profileIDs: (number | string)[]
  user: User | null
}): Promise<Map<string, BadgeSummary[]>> => {
  const badgeMap = new Map<string, BadgeSummary[]>()
  const uniqueProfileIDs = Array.from(new Set(profileIDs.map(String)))

  if (!uniqueProfileIDs.length) return badgeMap

  const awards: BadgeAward[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'profileBadges',
      depth: 2,
      limit: 100,
      overrideAccess: false,
      page,
      sort: '-featured,-awardedAt',
      user: user || undefined,
      where: {
        profiles: {
          in: uniqueProfileIDs,
        },
      },
    })

    awards.push(...(result.docs as BadgeAward[]))

    if (!result.hasNextPage || !result.nextPage) break
    page = result.nextPage
  }

  for (const award of awards) {
    const badge = normalizeBadge(award.badge)
    if (!badge) continue

    for (const profile of award.profiles || []) {
      const profileID = String(typeof profile === 'object' ? profile.id : profile)
      if (!uniqueProfileIDs.includes(profileID)) continue

      const badges = badgeMap.get(profileID) || []
      if (!badges.some((existing) => String(existing.id) === String(badge.id))) {
        badges.push(badge)
      }
      badgeMap.set(profileID, badges)
    }
  }

  return badgeMap
}

const normalizeBadge = (badge: BadgeAward['badge']): BadgeSummary | null => {
  if (!badge || typeof badge !== 'object' || !('id' in badge) || !('title' in badge)) return null

  return {
    category: 'category' in badge ? String(badge.category || '') : null,
    description: 'description' in badge ? String(badge.description || '') : null,
    displayStyle: 'displayStyle' in badge ? String(badge.displayStyle || '') : null,
    id: badge.id,
    slug: 'slug' in badge ? String(badge.slug || '') : null,
    title: String(badge.title),
  }
}
