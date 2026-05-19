import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '@/utilities/getCurrentUser'

import { ForgotPasswordForm } from '../_components/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()

  if (user) redirect('/dashboard')

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Account Access</p>
          <h1 className="portal-title-lg">Reset your password.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Enter the email connected to your RaidGuild Portal account and we will send reset
            instructions.
          </p>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Request a RaidGuild Portal password reset link.',
  title: 'Reset password',
}
