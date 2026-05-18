import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SignupForm } from '../_components/SignupForm'

export default function JoinPage() {
  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Join the Portal</p>
          <h1 className="portal-title-lg">Join the current RaidGuild cohort cycle.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Create a profile, pick a track, and start contributing to live projects with builders,
            creatives, operators, and strategists.
          </p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Start with the weekly brief, join the next session, and find the places where new
            contributors can plug in right now.
          </p>
          <hr className="my-8 border-border" />
          <p className="text-xl font-medium">
            Turn participation into skills, visibility, and opportunity.
          </p>
          <div className="mt-8 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <div>
              <p className="font-bold text-foreground">1. Create account</p>
              <p className="mt-2">
                Get access to daily briefs, member context, and contribution paths.
              </p>
            </div>
            <div>
              <p className="font-bold text-foreground">2. Pick a track</p>
              <p className="mt-2">Find active projects, sessions, and open collaboration areas.</p>
            </div>
            <div>
              <p className="font-bold text-foreground">3. Contribute visibly</p>
              <p className="mt-2">Build with others and create attribution for meaningful work.</p>
            </div>
          </div>
        </div>
        <div>
          <SignupForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Bringing a project, bounty, or funding path?{' '}
            <Link
              className="font-bold text-foreground underline decoration-primary/50"
              href="/sponsor"
            >
              Sponsor an opportunity
            </Link>
            .
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              className="font-bold text-foreground underline decoration-primary/50"
              href="/login"
            >
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
  description: 'Join the current RaidGuild cohort cycle and find active contribution paths.',
  title: 'Join the Portal',
}
