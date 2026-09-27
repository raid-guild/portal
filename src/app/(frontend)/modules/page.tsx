import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canEditContent, hasVerifiedAccount } from '@/access/roles'
import { ModuleNotificationSignup } from './ModuleNotificationSignup'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import type { Media, NotificationPreference } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getModuleAction, getModuleImageURL, relationDoc } from './moduleDisplay'
import { ModuleCabinet } from './ModuleCabinet'
import { getModuleDestination } from './moduleDestination'

export const dynamic = 'force-dynamic'

export default async function ModulesPage() {
  const user = await getCurrentUser()

  if (!user) return <ModulesTeaser />
  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to open Portal modules and launch connected tools." />
    )
  }

  const modules = await getModules(user)
  const notificationPreferences = await getNotificationPreferences(user)
  const canManageModules = canEditContent(user)

  const cards = modules.map((module) => {
    const thumbnail = relationDoc<Media>(module.thumbnail)
    return {
      id: module.id,
      name: module.name,
      summary: module.summary,
      category: module.category || 'tools',
      status: module.status || 'idea',
      destination: getModuleDestination(module),
      image: getModuleImageURL(thumbnail),
      imageAlt: thumbnail?.alt || '',
      detail: module.slug ? `/modules/${encodeURIComponent(module.slug)}` : null,
      action: getModuleAction(module),
    }
  })

  return (
    <>
      <ModuleCabinet modules={cards} canManage={canManageModules} />
      <div className="container pb-16">
        <ModuleNotificationSignup
          email={user.email}
          emailVerified={Boolean(user.emailVerifiedAt)}
          initialPreferences={notificationPreferences}
          userID={user.id}
        />
      </div>
    </>
  )
}

export const metadata: Metadata = {
  title: 'Modules',
}

const ModulesTeaser = () => (
  <main className="container pb-24 pt-12">
    <section className="max-w-3xl">
      <p className="mb-4 portal-kicker">Modules</p>
      <h1 className="portal-title">Portal modules</h1>
      <p className="mt-5 text-base leading-7 text-muted-foreground">
        RaidGuild members use modules to explore experimental Portal capabilities like knowledge
        discovery, contribution surfaces, and recognition tools.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="portal-admin-link" href="/join">
          Join to access modules
        </Link>
        <Link className="portal-admin-link" href="/login?next=%2Fmodules">
          Log in
        </Link>
      </div>
    </section>
    <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article className="portal-panel">
        <p className="portal-kicker">Experimental</p>
        <h2 className="mt-2 portal-heading-sm">Portal Graph</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          An interactive graph for exploring how member skills, roles, profiles, and future Portal
          records connect.
        </p>
        <Link className="portal-admin-link mt-6" href="/join">
          Join to explore
        </Link>
      </article>
    </section>
  </main>
)

const getModules = async (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'modules',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder,name',
    user,
    where: {
      and: [
        {
          enabled: {
            equals: true,
          },
        },
        {
          status: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs
}

const getNotificationPreferences = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
): Promise<NotificationPreference | null> => {
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
