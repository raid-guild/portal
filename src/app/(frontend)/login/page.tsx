import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { LoginForm } from '../_components/LoginForm'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getSafeNextPath } from '@/utilities/safeNextPath'

type Args = {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function LoginPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])
  const nextPath = getSafeNextPath(searchParams.next)

  if (user) redirect(nextPath || '/dashboard')

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Member Login</p>
          <h1 className="portal-title-lg">Return to the current brief.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Log in to see the daily brief, active threads, upcoming sessions, and contribution paths
            for the current cohort cycle.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Log in to the RaidGuild Portal daily brief and authenticated dashboard.',
  title: 'Log in',
}
