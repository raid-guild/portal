import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InquiryForm } from '../../_components/InquiryForm'

type InquiryType = 'client' | 'sponsor' | 'grant' | 'opportunity' | 'general'

type FunnelConfig = {
  eyebrow: string
  intro: string
  messageLabel: string
  title: string
  type: InquiryType
}

const funnelConfigs: Record<InquiryType, FunnelConfig> = {
  client: {
    eyebrow: 'Build Request',
    intro:
      'Share the product, technical, or strategic problem you want to move forward. This starts a private intake record for review.',
    messageLabel: 'What do you want to build, validate, or unblock?',
    title: 'Request a build with RaidGuild.',
    type: 'client',
  },
  general: {
    eyebrow: 'Guild Inquiry',
    intro:
      'Not sure where to start? Share the question or context and the guild can route it toward the right next step.',
    messageLabel: 'What should we know?',
    title: 'Talk to the guild.',
    type: 'general',
  },
  grant: {
    eyebrow: 'Funding Path',
    intro:
      'Bring grants, public goods funding, ecosystem budgets, or other support opportunities into review.',
    messageLabel: 'What funding path or grant context are you bringing?',
    title: 'Offer funding or grants.',
    type: 'grant',
  },
  opportunity: {
    eyebrow: 'Collaboration',
    intro:
      'Start a partnership, research, community, or ecosystem collaboration thread without needing to know the right internal channel.',
    messageLabel: 'What collaboration opportunity should RaidGuild understand?',
    title: 'Bring a collaboration opportunity.',
    type: 'opportunity',
  },
  sponsor: {
    eyebrow: 'Sponsorship',
    intro:
      'Share sponsorship, bounty, paid work, or support context so it can be reviewed without getting lost in chat.',
    messageLabel: 'What are you sponsoring or bringing to the guild?',
    title: 'Sponsor the guild.',
    type: 'sponsor',
  },
}

type Args = {
  params: Promise<{
    type: string
  }>
}

export default async function InquiryPage({ params }: Args) {
  const { type } = await params
  const config = funnelConfigs[type as InquiryType]

  if (!config) notFound()

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">{config.eyebrow}</p>
          <h1 className="portal-title-lg">{config.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{config.intro}</p>
          <div className="mt-8 border border-border p-5 text-sm leading-6 text-muted-foreground">
            <p className="font-bold text-foreground">How this works</p>
            <p className="mt-3">
              Submit the inquiry first. The Portal saves it immediately, then asks you to create an
              account so follow-up can connect to your profile.
            </p>
          </div>
          <Link className="portal-link mt-8 inline-flex" href="/join">
            Back to join
          </Link>
        </div>
        <InquiryForm
          messageLabel={config.messageLabel}
          sourceRoute={`/inquire/${config.type}`}
          type={config.type}
        />
      </section>
    </main>
  )
}

export function generateStaticParams() {
  return Object.keys(funnelConfigs).map((type) => ({ type }))
}

export const metadata: Metadata = {
  description: 'Start a RaidGuild inquiry and create an account to continue.',
  title: 'Start an inquiry',
}
