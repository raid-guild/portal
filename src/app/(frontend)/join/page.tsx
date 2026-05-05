import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SignupForm } from '../_components/SignupForm'

export default function JoinPage() {
  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Join the Portal
          </p>
          <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
            FORGE YOUR PATH.
            <br />
            EARN YOUR SEAT.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            RaidGuild&apos;s monthly cohort is a 4-week proving ground where you embark on real
            projects, train with battle-tested builders, and claim your place in the premier design
            and dev collective of the decentralized realm.
          </p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Cohorts launch on the first Monday of each month. Limited seats.
          </p>
          <hr className="my-8 border-border" />
          <p className="text-xl font-medium">Create an account, then build your profile.</p>
          <div className="mt-8 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">1. Create account</p>
              <p className="mt-2">Get access to member-facing portal surfaces.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">2. Build profile</p>
              <p className="mt-2">Choose your roles, skills, links, and visibility.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">3. Get discovered</p>
              <p className="mt-2">Make it easier to connect you with projects and opportunities.</p>
            </div>
          </div>
        </div>
        <div>
          <SignupForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="font-medium text-foreground underline" href="/admin/login">
              Log in
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Create a RaidGuild Portal account and begin your profile.',
  title: 'Join the Portal',
}
