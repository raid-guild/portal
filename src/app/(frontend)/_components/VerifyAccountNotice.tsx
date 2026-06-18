import Link from 'next/link'
import React from 'react'

export const VerifyAccountNotice: React.FC<{
  description?: string
  eyebrow?: string
  title?: string
}> = ({
  description = 'Verify your email from your profile page to unlock Portal member surfaces and contribution actions.',
  eyebrow = 'Verification required',
  title = 'Verify your account',
}) => (
  <main className="container pb-24 pt-12">
    <section className="max-w-3xl border border-border bg-card/30 p-8">
      <p className="portal-kicker">{eyebrow}</p>
      <h1 className="portal-title mt-4">{title}</h1>
      <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
      <Link className="portal-admin-link mt-8 inline-flex" href="/me">
        Open profile
      </Link>
    </section>
  </main>
)
