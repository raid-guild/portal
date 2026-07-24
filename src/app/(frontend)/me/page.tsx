import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Event, Post, Profile, Project, User } from '@/payload-types'
import { EmailVerificationCard } from '../_components/EmailVerificationCard'
import { NotificationPreferencesForm } from './NotificationPreferencesForm'
import { ProfileWizardForm } from '../_components/ProfileWizardForm'
import { ProfileAvatarCard } from './ProfileAvatarCard'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

type Args = {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function MePage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])

  if (!user) {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value)
    }

    const returnPath = params.size ? `/me?${params.toString()}` : '/me'
    redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  }

  const [
    badgeCount,
    checkedInToday,
    notificationPreferences,
    profile,
    pointsTotal,
    skills,
    roles,
    unreadNotifications,
    claimableProfiles,
  ] = await Promise.all([
    getBadgeCount(user),
    getCheckedInToday(user),
    getNotificationPreferences(user),
    getProfileForUser(user.id),
    getPointsTotal(user),
    getProfileSkills(),
    getProfileRoles(),
    getUnreadNotificationCount(user),
    getClaimableProfiles(user),
  ])

  const createdRecords = await getCreatedRecords(user, profile)
  const nextPath = getSafeNextPath(searchParams.next)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="mb-4 portal-kicker">Profile Builder</p>
          <h1 className="portal-title">My profile</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Manage your public identity, avatar, links, skills, roles, and visibility without
            entering Payload Admin.
          </p>
          <ProfileAvatarCard profile={profile} />
        </div>
        <div className="space-y-4">
          <EmailVerificationCard email={user.email} emailVerifiedAt={user.emailVerifiedAt} />
          <p className="mt-4 border-l border-border pl-6 text-sm text-muted-foreground">
            {profile ? 'Profile connected' : 'Profile not started'}
          </p>
          <p className="mt-3 portal-heading">{pointsTotal} points</p>
          <PortalLinks
            badgeCount={badgeCount}
            checkedInToday={checkedInToday}
            profile={profile}
            unreadNotifications={unreadNotifications}
          />
        </div>
      </section>

      <nav className="mt-10 flex flex-wrap gap-3 text-sm">
        <a className="portal-admin-link" href="#profile">
          Profile
        </a>
        <a className="portal-admin-link" href="#account">
          Account
        </a>
        <a className="portal-admin-link" href="#notifications">
          Notifications
        </a>
        <a className="portal-admin-link" href="#activity">
          Activity
        </a>
      </nav>

      <section className="mt-12" id="profile">
        <h2 className="mb-4 portal-heading">Profile wizard</h2>
        <ProfileWizardForm
          accountEmail={user.email}
          accountUserID={user.id}
          claimableProfiles={profile ? [] : claimableProfiles}
          profile={profile}
          roles={roles}
          skills={skills}
          nextPath={nextPath}
        />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="portal-panel">
          <h2 className="portal-heading-sm">Current Profile</h2>
          {profile ? (
            <ProfileSummary profile={profile} />
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-muted-foreground">
                No profile exists for this account yet. Use the profile wizard above to create one.
              </p>
            </div>
          )}
        </div>
        <div className="portal-panel">
          <h2 className="portal-heading-sm">Profile Checklist</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Basic identity: handle, display name, bio, location.</li>
            <li>Links: website, GitHub, Farcaster, Discord, portfolio.</li>
            <li>Profile skills: choose the capabilities people should find you by.</li>
            <li>Profile roles: choose up to two RaidGuild roles.</li>
            <li>Visibility: public, authenticated members, or private.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12" id="account">
        <div className="portal-panel">
          <h2 className="portal-heading-sm">Account</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {user.emailVerifiedAt
              ? 'Your account email is verified and can be used for notification delivery.'
              : 'Verify your account email in the summary panel before enabling email notifications.'}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{user.email}</p>
        </div>
      </section>

      <section className="mt-12" id="notifications">
        <NotificationPreferencesForm
          emailVerified={Boolean(user.emailVerifiedAt)}
          initialPreferences={notificationPreferences}
          userID={user.id}
        />
      </section>

      <section className="mt-12" id="activity">
        <h2 className="portal-heading">Created by you</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Drafts and published records connected to your user or profile.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <CreatedList items={createdRecords.projects} title="Projects" />
          <CreatedList items={createdRecords.events} title="Sessions" />
          <CreatedList items={createdRecords.posts} title="Posts" />
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'My Profile',
}

const getSafeNextPath = (next?: string) =>
  next?.startsWith('/') && !next.startsWith('//') ? next : undefined

const ProfileSummary: React.FC<{ profile: Profile }> = ({ profile }) => {
  const avatar = typeof profile.avatar === 'object' && profile.avatar ? profile.avatar : null

  return (
    <div className="mt-4 space-y-4 text-sm leading-6">
      <div className="flex items-center gap-4">
        {avatar?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-14 w-14 rounded-full object-cover" src={avatar.url} />
        ) : null}
        <div>
          <p className="font-bold">{profile.displayName}</p>
          <p className="text-muted-foreground">@{profile.handle}</p>
        </div>
      </div>
      <p className="text-muted-foreground">{profile.bio}</p>
      <div className="flex flex-wrap gap-2">
        <span className="portal-pill">Status: {profile.status}</span>
        <span className="portal-pill">Visibility: {profile.visibility}</span>
      </div>
    </div>
  )
}

const PortalLinks: React.FC<{
  badgeCount: number
  checkedInToday: boolean
  profile: Profile | null
  unreadNotifications: number
}> = ({ badgeCount, checkedInToday, profile, unreadNotifications }) => (
  <div className="portal-panel">
    <h2 className="portal-heading-sm">Your portal</h2>
    <div className="mt-4 grid gap-3 text-sm">
      <Link className="portal-admin-link justify-between" href="/inbox">
        <span>Inbox</span>
        {unreadNotifications ? <span>{unreadNotifications} unread</span> : <span>Open</span>}
      </Link>
      <Link className="portal-admin-link justify-between" href="/dashboard">
        <span>Daily check-in</span>
        <span>{checkedInToday ? 'Done today' : 'Check in'}</span>
      </Link>
      <Link className="portal-admin-link justify-between" href="/badges">
        <span>Badges</span>
        <span>{badgeCount}</span>
      </Link>
      {profile?.handle ? (
        <Link className="portal-admin-link justify-between" href={`/members/${profile.handle}`}>
          <span>Public profile</span>
          <span>View</span>
        </Link>
      ) : null}
      <Link className="portal-admin-link justify-between" href="/dashboard">
        <span>Dashboard</span>
        <span>Open</span>
      </Link>
    </div>
  </div>
)

const CreatedList: React.FC<{
  items: (Event | Post | Project)[]
  title: string
}> = ({ items, title }) => (
  <div className="portal-panel">
    <h3 className="font-bold">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.length ? (
        items.map((item) => (
          <article className="text-sm" key={item.id}>
            <Link className="font-medium hover:text-primary" href={recordHref(item)}>
              {item.title}
            </Link>
            {'_status' in item ? <p className="portal-kicker">{item._status || 'draft'}</p> : null}
          </article>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Nothing created yet.</p>
      )}
    </div>
  </div>
)

const recordHref = (item: Event | Post | Project) => {
  if ('startsAt' in item) return `/events/${item.id}`

  const collection = 'projectStatus' in item ? 'projects' : 'posts'

  if (item._status === 'published' && item.slug) {
    return `/${collection}/${item.slug}`
  }

  return `/admin/collections/${collection}/${item.id}`
}

const getProfileForUser = async (userID: string | number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const getProfileSkills = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profileSkills',
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  return result.docs
}

const getProfileRoles = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profileRoles',
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  return result.docs
}

const getClaimableProfiles = async (user: User) => {
  if (!user.email) return []

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    pagination: false,
    sort: 'displayName',
    where: {
      and: [
        {
          claimStatus: {
            equals: 'unclaimed',
          },
        },
        {
          claimEmail: {
            equals: user.email.trim().toLowerCase(),
          },
        },
        {
          user: {
            exists: false,
          },
        },
      ],
    },
  })

  return result.docs
}

const getPointsTotal = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pointEvents',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          recipient: {
            equals: user.id,
          },
        },
        {
          status: {
            equals: 'valid',
          },
        },
      ],
    },
  })

  return result.docs.reduce((sum, event) => sum + (event.amount || 0), 0)
}

const getUnreadNotificationCount = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.count({
    collection: 'notifications',
    overrideAccess: false,
    user,
    where: {
      and: [
        {
          recipient: {
            equals: user.id,
          },
        },
        {
          status: {
            equals: 'unread',
          },
        },
      ],
    },
  })

  return result.totalDocs
}

const getNotificationPreferences = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'notificationPreferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  return result.docs[0] || null
}

const getCheckedInToday = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const result = await payload.find({
    collection: 'dailyEngagements',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          user: {
            equals: user.id,
          },
        },
        {
          engagementDate: {
            equals: today.toISOString(),
          },
        },
        {
          status: {
            equals: 'valid',
          },
        },
      ],
    },
  })

  return Boolean(result.docs[0])
}

const getBadgeCount = async (user: User) => {
  const profile = await getProfileForUser(user.id)
  if (!profile?.id) return 0

  const payload = await getPayload({ config: configPromise })
  const result = await payload.count({
    collection: 'profileBadges',
    overrideAccess: false,
    user,
    where: {
      profiles: {
        in: [String(profile.id)],
      },
    },
  })

  return result.totalDocs
}

const getCreatedRecords = async (user: User, profile?: Profile | null) => {
  const payload = await getPayload({ config: configPromise })
  const profileID = profile?.id

  const [projects, events, posts] = await Promise.all([
    profileID
      ? payload.find({
          collection: 'projects',
          depth: 0,
          limit: 10,
          overrideAccess: true,
          pagination: false,
          sort: '-updatedAt',
          where: {
            contributors: {
              in: [profileID],
            },
          },
        })
      : Promise.resolve({ docs: [] as Project[] }),
    profileID
      ? payload.find({
          collection: 'events',
          depth: 0,
          limit: 10,
          overrideAccess: true,
          pagination: false,
          sort: '-updatedAt',
          where: {
            relatedProfiles: {
              in: [profileID],
            },
          },
        })
      : Promise.resolve({ docs: [] as Event[] }),
    payload.find({
      collection: 'posts',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: {
        authors: {
          in: [user.id],
        },
      },
    }),
  ])

  return {
    events: events.docs,
    posts: posts.docs,
    projects: projects.docs,
  }
}
