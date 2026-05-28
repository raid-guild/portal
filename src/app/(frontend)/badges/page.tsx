import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

type BadgeCard = {
  category?: string | null
  description?: string | null
  displayStyle?: string | null
  id: number | string
  isRetired?: boolean | null
  recipientCount: number
  slug?: string | null
  title: string
}

export default async function BadgesPage() {
  const user = await getCurrentUser()
  const badges = await getBadges(user)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Recognition</p>
          <h1 className="portal-title">Badges</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Durable recognition for cohort participation, shipped work, session leadership, and
            community stewardship.
          </p>
        </div>
        <Link className="portal-admin-link" href="/members">
          View members
        </Link>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.length ? (
          badges.map((badge) => (
            <article className="portal-panel" key={badge.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="portal-kicker">{formatCategory(badge.category)}</p>
                  <h2 className="mt-2 portal-heading-sm">{badge.title}</h2>
                </div>
                {badge.isRetired ? <span className="portal-pill">Retired</span> : null}
              </div>
              {badge.description ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{badge.description}</p>
              ) : null}
              <p className="mt-5 text-sm font-medium">
                {badge.recipientCount === 1
                  ? '1 member has received this badge'
                  : `${badge.recipientCount} members have received this badge`}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No badges are visible yet.</p>
        )}
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Badges',
}

const getBadges = async (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<BadgeCard[]> => {
  const payload = await getPayload({ config: configPromise })
  const badgeResult = await payload.find({
    collection: 'badges',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder,title',
    user: user || undefined,
  })

  const badgeIDs = badgeResult.docs.map((badge) => badge.id)
  const recipientCounts = await getRecipientCounts({ badgeIDs, payload, user })

  return badgeResult.docs.map((badge) => ({
    category: badge.category,
    description: badge.description,
    displayStyle: badge.displayStyle,
    id: badge.id,
    isRetired: badge.isRetired,
    recipientCount: recipientCounts.get(String(badge.id)) || 0,
    slug: badge.slug,
    title: badge.title,
  }))
}

const getRecipientCounts = async ({
  badgeIDs,
  payload,
  user,
}: {
  badgeIDs: (number | string)[]
  payload: Awaited<ReturnType<typeof getPayload>>
  user: Awaited<ReturnType<typeof getCurrentUser>>
}) => {
  const counts = new Map<string, number>()
  if (!badgeIDs.length) return counts

  let page = 1

  while (true) {
    const awardResult = await payload.find({
      collection: 'profileBadges',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      page,
      user: user || undefined,
      where: {
        badge: {
          in: badgeIDs.map(String),
        },
      },
    })

    for (const award of awardResult.docs) {
      const badgeID = String(award.badge)
      const profiles = Array.isArray(award.profiles) ? award.profiles : []
      counts.set(badgeID, (counts.get(badgeID) || 0) + profiles.length)
    }

    if (!awardResult.hasNextPage || !awardResult.nextPage) break
    page = awardResult.nextPage
  }

  return counts
}

const formatCategory = (category?: string | null) =>
  category ? category.replace(/-/g, ' ') : 'badge'
