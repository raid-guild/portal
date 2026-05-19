import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '@/utilities/getCurrentUser'

import { ResetPasswordForm } from '../_components/ResetPasswordForm'

type Args = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ResetPasswordPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])

  if (user) redirect('/dashboard')

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Account Access</p>
          <h1 className="portal-title-lg">Choose a new password.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Reset links expire. If this link no longer works, request a fresh one.
          </p>
        </div>
        <ResetPasswordForm token={searchParams.token} />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Set a new RaidGuild Portal password.',
  title: 'Choose a new password',
}
