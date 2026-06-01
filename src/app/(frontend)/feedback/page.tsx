import type { Metadata } from 'next'
import Link from 'next/link'

import { FeedbackForm } from './FeedbackForm'
import { getCurrentUser } from '@/utilities/getCurrentUser'

type Args = {
  searchParams: Promise<{
    from?: string
  }>
}

export default async function FeedbackPage({ searchParams }: Args) {
  const [{ from }, user] = await Promise.all([searchParams, getCurrentUser()])
  const loginHref = getLoginHref(from)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
        <div className="max-w-3xl">
          <p className="mb-4 portal-kicker">Portal feedback</p>
          <h1 className="portal-title-lg">Send a bug report or product note</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Share the rough edge while it is fresh. The portal will attach your account and the
            page context so admins can triage it without a long back-and-forth.
          </p>
          <div className="mt-8 border border-border p-5 text-sm leading-6 text-muted-foreground">
            <p className="font-bold text-foreground">Useful reports include</p>
            <p className="mt-3">
              What you expected, what happened instead, and whether it blocks your current flow.
            </p>
          </div>
        </div>

        {user ? (
          <FeedbackForm defaultEmail={user.email} from={from} />
        ) : (
          <div className="portal-panel">
            <p className="portal-kicker">Login required</p>
            <h2 className="mt-3 portal-heading-sm">Connect feedback to an account</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Login or create an account so feedback can be connected to your portal identity and
              followed up safely.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="portal-admin-link" href={loginHref}>
                Login
              </Link>
              <Link className="portal-admin-link" href="/join">
                Join
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Submit feedback, bug reports, and product notes for the Portal.',
  title: 'Feedback',
}

const getLoginHref = (from?: string) => {
  const feedbackPath = from ? `/feedback?from=${encodeURIComponent(from)}` : '/feedback'

  return `/login?next=${encodeURIComponent(feedbackPath)}`
}
