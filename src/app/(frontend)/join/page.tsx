import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SignupForm } from '../_components/SignupForm'

type Args = {
  searchParams?: Promise<{
    email?: string
    inquiry?: string
  }>
}

const funnelLinks = [
  {
    description: 'Talk through a client build, product spike, or technical implementation need.',
    href: '/inquire/client',
    label: 'Request a build',
  },
  {
    description: 'Bring sponsorship, bounties, or paid work into the guild review path.',
    href: '/inquire/sponsor',
    label: 'Sponsor the guild',
  },
  {
    description: 'Route grants, public goods funding, or ecosystem support to the right context.',
    href: '/inquire/grant',
    label: 'Offer funding or grants',
  },
  {
    description: 'Start a partnership, collaboration, research, or community opportunity.',
    href: '/inquire/opportunity',
    label: 'Bring a collaboration',
  },
  {
    description: 'Ask a general question and get routed toward the right next step.',
    href: '/inquire/general',
    label: 'Talk to the guild',
  },
]

export default async function JoinPage({ searchParams }: Args) {
  const params = await searchParams
  const initialEmail = normalizeEmail(params?.email)
  const hasInquiryContext = Boolean(params?.inquiry)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Join the Portal</p>
          <h1 className="portal-title-lg">Join RaidGuild's digital coworking space.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Create an account to connect your profile, follow live guild activity, join sessions,
            and find useful places to contribute.
          </p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            The Portal shows the current brief, upcoming sessions, active projects, contributor
            requests, and the people building around them.
          </p>
          <hr className="my-8 border-border" />
          <p className="text-xl font-medium">
            Turn participation into skills, visibility, and opportunity.
          </p>
          <div className="mt-8 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            {[
              'Follow real guild activity without digging through chat.',
              'Build a public profile connected to sessions, projects, posts, and badges.',
              'Discover projects and contribution requests.',
              'Join live sessions and keep track of context afterward.',
              'Bring client, sponsor, grant, or partnership opportunities into the right intake path.',
            ].map((item) => (
              <div className="border border-border p-4" key={item}>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          {hasInquiryContext ? (
            <div className="mb-4 border border-primary bg-primary/10 p-4 text-sm leading-6">
              Your request has been started. Create an account so we can connect it to your Portal
              profile and keep follow-up tied to your work.
            </div>
          ) : null}
          <SignupForm initialEmail={initialEmail} />
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

      <section className="mt-16">
        <p className="portal-kicker">Need a different path?</p>
        <h2 className="portal-heading mt-4">Start with the right intake.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {funnelLinks.map((link) => (
            <Link
              className="portal-panel block hover:border-primary"
              href={link.href}
              key={link.href}
            >
              <span className="font-mono text-sm font-bold uppercase">{link.label}</span>
              <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description:
    'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
  title: 'Join the Portal',
}

const normalizeEmail = (email: string | undefined) => {
  const normalized = email?.trim().toLowerCase()

  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined
}
