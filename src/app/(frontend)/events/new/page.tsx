import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { canCreateDiscordScheduledEvents } from '@/utilities/discordScheduledEvents'

import { SessionCreateForm } from './SessionCreateForm'

export const dynamic = 'force-dynamic'

export default async function NewSessionPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!canContributeContent(user)) {
    return (
      <main className="container pb-24 pt-12">
        <p className="portal-kicker">Sessions</p>
        <h1 className="portal-title mt-4">Create session</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Your account does not have permission to create sessions.
        </p>
        <Link className="portal-link mt-8 inline-flex" href="/events">
          Back to sessions
        </Link>
      </main>
    )
  }

  const [speakers, defaultProfile] = await Promise.all([
    getSpeakerOptions(),
    getProfileForUser(user.id),
  ])

  return (
    <main className="container max-w-4xl pb-24 pt-12">
      <p className="portal-kicker">Sessions</p>
      <h1 className="portal-title mt-4">Create session</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">
        Set the details for the next live gathering.
      </p>
      <SessionCreateForm
        canSyncDiscord={canCreateDiscordScheduledEvents()}
        defaultSpeakerID={defaultProfile?.id}
        defaultStart={getDefaultStart()}
        speakers={speakers}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Create session',
}

const getSpeakerOptions = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'displayName',
    where: {
      status: {
        equals: 'active',
      },
    },
  })

  return result.docs.map((profile) => ({
    id: profile.id,
    label: profile.displayName,
  }))
}

const getProfileForUser = async (userID: string | number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
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

const getDefaultStart = () => {
  const date = new Date()
  date.setHours(date.getHours() + 1)
  date.setMinutes(date.getMinutes() < 30 ? 30 : 0, 0, 0)

  if (date.getMinutes() === 0) {
    date.setHours(date.getHours() + 1)
  }

  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)

  return local.toISOString().slice(0, 16)
}
