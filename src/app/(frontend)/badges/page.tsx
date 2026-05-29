import type { Metadata } from 'next'
import { Award, Shield, Sparkles, Star, Users } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

type BadgeCard = {
  category?: string | null
  description?: string | null
  displayStyle?: string | null
  fallbackIcon?: string | null
  id: number | string
  isRetired?: boolean | null
  recipientCount: number
  slug?: string | null
  title: string
  artworkURL?: string | null
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
              <div className="flex items-start gap-4">
                <BadgeArtwork
                  fallbackIcon={badge.fallbackIcon}
                  title={badge.title}
                  url={badge.artworkURL}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="portal-kicker">{formatCategory(badge.category)}</p>
                      <h2 className="mt-2 portal-heading-sm">{badge.title}</h2>
                    </div>
                    {badge.isRetired ? <span className="portal-pill">Retired</span> : null}
                  </div>
                  {badge.description ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {badge.description}
                    </p>
                  ) : null}
                  <p className="mt-5 text-sm font-medium">
                    {badge.recipientCount === 1
                      ? '1 member has received this badge'
                      : `${badge.recipientCount} members have received this badge`}
                  </p>
                </div>
              </div>
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
    depth: 1,
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
    fallbackIcon: badge.fallbackIcon,
    id: badge.id,
    isRetired: badge.isRetired,
    recipientCount: recipientCounts.get(String(badge.id)) || 0,
    slug: badge.slug,
    title: badge.title,
    artworkURL: getMediaURL(badge.artwork),
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

const getMediaURL = (media?: Media | number | null) =>
  typeof media === 'object' && media ? media.sizes?.square?.url || media.url || null : null

const BadgeArtwork: React.FC<{
  fallbackIcon?: string | null
  title: string
  url?: string | null
}> = ({ fallbackIcon, title, url }) => {
  const Icon = iconFor(fallbackIcon)

  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-border bg-card/60">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover" src={url} />
      ) : (
        <div aria-label={`${title} badge placeholder`} className="text-primary">
          <Icon className="h-9 w-9" />
        </div>
      )}
    </div>
  )
}

const iconFor = (fallbackIcon?: string | null) => {
  switch (fallbackIcon) {
    case 'award':
      return Award
    case 'shield':
      return Shield
    case 'star':
      return Star
    case 'users':
      return Users
    case 'spark':
    default:
      return Sparkles
  }
}
