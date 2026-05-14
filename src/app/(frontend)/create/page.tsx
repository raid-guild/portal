import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { CreatorForms } from '../_components/CreatorForms'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export default async function CreatePage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  const [profile, projects] = await Promise.all([getProfileForUser(user.id), getProjects(user)])

  return (
    <main className="container pb-24 pt-12">
      <section>
        <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          Contributor Studio
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Create portal records</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Scaffold project, session, and post drafts from simple forms. These records start as
          drafts so the portal can keep review and publishing separate from contribution.
        </p>
      </section>

      {!profile ? (
        <section className="mt-10 border border-border p-6">
          <h2 className="text-xl font-semibold">Create your profile first</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Project and session drafts are stronger when they can attribute a contributor profile.
            You can still create posts, but profile attribution unlocks the rest of the workflow.
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <CreatorForms profile={profile} projects={projects} user={user} />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Create RaidGuild portal project, session, and post drafts.',
  title: 'Create Portal Records',
}

const getProfileForUser = async (userID: string | number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 1,
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

const getProjects = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 0,
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    user,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}
