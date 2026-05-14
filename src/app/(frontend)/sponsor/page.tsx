import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SponsorInquiryForm } from '../_components/SponsorInquiryForm'

export default function SponsorPage() {
  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_30rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Sponsor RaidGuild
          </p>
          <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
            Bring an opportunity to the cohort.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Have a project, bounty, grant, challenge, or collaboration path for RaidGuild
            contributors? Share the context and we will route it into the right cohort track.
          </p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Sponsor inquiries are private by default. Accepted opportunities can become projects,
            sessions, bounties, or weekly brief items after review.
          </p>

          <hr className="my-8 border-border" />

          <p className="text-xl font-medium">Good sponsor opportunities are concrete.</p>
          <div className="mt-8 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">1. Show the work</p>
              <p className="mt-2">Describe the project, challenge, or funding path clearly.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">2. Name the need</p>
              <p className="mt-2">Share the skills, roles, or collaborators you are looking for.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">3. Pick a next step</p>
              <p className="mt-2">Route the opportunity toward review, a session, or a call.</p>
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Want to participate instead?{' '}
            <Link className="font-medium text-foreground underline" href="/join">
              Join the cohort
            </Link>
            .
          </p>
        </div>
        <SponsorInquiryForm />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Submit a project, bounty, grant, or collaboration opportunity for RaidGuild.',
  title: 'Sponsor RaidGuild',
}
