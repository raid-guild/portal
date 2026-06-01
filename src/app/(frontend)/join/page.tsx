import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { SignupForm } from '../_components/SignupForm'
import { getJoinPageCopy } from '@/utilities/pageCopy'

type Args = {
  searchParams?: Promise<{
    email?: string
    inquiry?: string
  }>
}

export default async function JoinPage({ searchParams }: Args) {
  const params = await searchParams
  const copy = await getJoinPageCopy()
  const initialEmail = normalizeEmail(params?.email)
  const hasInquiryContext = Boolean(params?.inquiry)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">{copy.eyebrow}</p>
          <h1 className="portal-title-lg">{copy.headline}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
          {copy.secondaryIntro ? (
            <p className="mt-5 text-base leading-7 text-muted-foreground">{copy.secondaryIntro}</p>
          ) : null}
          <hr className="my-8 border-border" />
          {copy.benefitsHeading ? (
            <p className="text-xl font-medium">{copy.benefitsHeading}</p>
          ) : null}
          <div className="mt-8 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            {copy.benefits?.map((item, index) => (
              <div className="border border-border p-4" key={`${index}-${item}`}>
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
        {copy.funnelEyebrow ? <p className="portal-kicker">{copy.funnelEyebrow}</p> : null}
        {copy.funnelHeading ? <h2 className="portal-heading mt-4">{copy.funnelHeading}</h2> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {copy.funnelLinks?.map((link) => (
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

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getJoinPageCopy()

  return {
    description: copy.seoDescription,
    title: copy.seoTitle,
  }
}

const normalizeEmail = (email: string | undefined) => {
  const normalized = email?.trim().toLowerCase()

  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined
}
