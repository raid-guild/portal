import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { canEditContent, hasVerifiedAccount } from '@/access/roles'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import { getNewsletterConfig } from '@/modules/newsletter/config'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { NewsletterCampaignTool } from './NewsletterCampaignTool'
import type { NewsletterCampaign, Post } from '@/payload-types'

export const dynamic = 'force-dynamic'

type NewsletterPageProps = {
  searchParams?: Promise<{
    postId?: string
  }>
}

export default async function NewsletterPage({ searchParams }: NewsletterPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <main className="container pb-24 pt-12">
        <section className="max-w-3xl border border-border bg-card/30 p-8">
          <p className="portal-kicker">Login required</p>
          <h1 className="portal-title mt-4">Open Newsletter</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            A member account is required to open the Newsletter module.
          </p>
          <Link className="portal-admin-link mt-8 inline-flex" href="/login?next=%2Fnewsletter">
            Log in
          </Link>
        </section>
      </main>
    )
  }

  if (!hasVerifiedAccount(user)) {
    return <VerifyAccountNotice description="Verify your email to open the Newsletter module." />
  }

  const canCreateCampaigns = canEditContent(user)
  const config = getNewsletterConfig()
  const params = await searchParams
  const initialPostID = typeof params?.postId === 'string' ? params.postId : ''
  const recentCampaigns = canCreateCampaigns ? await getRecentNewsletterCampaigns(user) : []

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Module</p>
          <h1 className="portal-title">Newsletter</h1>
        </div>
        {canCreateCampaigns ? (
          <Link className="portal-admin-link" href="/admin/collections/newsletterCampaigns">
            Campaign records
          </Link>
        ) : null}
      </section>

      {canCreateCampaigns ? (
        <div className="mt-10">
          <NewsletterCampaignTool
            defaultListIDs={config.defaultListIDs}
            defaultTestEmail={config.defaultTestEmail}
            initialPostID={initialPostID}
          />
          <NewsletterCampaignHistory campaigns={recentCampaigns} />
        </div>
      ) : (
        <section className="portal-panel mt-10">
          <h2 className="portal-heading-sm">Editor access required</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Newsletter campaign creation is restricted to Portal editors and admins.
          </p>
        </section>
      )}
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Newsletter',
}

const getRecentNewsletterCampaigns = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'newsletterCampaigns',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })

  return result.docs as NewsletterCampaign[]
}

const NewsletterCampaignHistory: React.FC<{ campaigns: NewsletterCampaign[] }> = ({
  campaigns,
}) => (
  <section className="portal-panel mt-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="portal-kicker">History</p>
        <h2 className="mt-2 portal-heading-sm">Recent campaigns</h2>
      </div>
      <Link className="portal-admin-link" href="/admin/collections/newsletterCampaigns">
        Admin records
      </Link>
    </div>

    {campaigns.length ? (
      <div className="mt-6 divide-y divide-border border-y border-border">
        {campaigns.map((campaign) => (
          <article className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]" key={campaign.id}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="portal-pill">{statusLabels[campaign.status]}</span>
                <span className="portal-pill">{sourceModeLabels[campaign.sourceMode]}</span>
                {campaign.listmonkCampaignID ? (
                  <span className="portal-pill">listmonk {campaign.listmonkCampaignID}</span>
                ) : null}
              </div>
              <h3 className="mt-3 text-base font-bold text-foreground">{campaign.subject}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getPostTitle(campaign.post)} / lists{' '}
                {campaign.listIDs.map((item) => item.listID).join(', ')}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Synced {formatDate(campaign.lastSyncedAt)} / tested{' '}
                {formatDate(campaign.lastTestSentAt)}
              </p>
              {campaign.lastError ? (
                <p className="mt-3 text-sm leading-6 text-red-400">{campaign.lastError}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-start gap-2 lg:justify-end">
              <Link
                className="portal-admin-link"
                href={`/newsletter?postId=${getPostID(campaign.post) || ''}`}
              >
                Update draft
              </Link>
              {campaign.listmonkCampaignURL ? (
                <a
                  className="portal-admin-link"
                  href={campaign.listmonkCampaignURL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open in listmonk
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        No Portal newsletter campaign records exist yet.
      </p>
    )}
  </section>
)

const statusLabels: Record<NewsletterCampaign['status'], string> = {
  archived: 'Archived',
  draft: 'Draft',
  error: 'Error',
  sent: 'Sent',
  test_sent: 'Test sent',
}

const sourceModeLabels: Record<NewsletterCampaign['sourceMode'], string> = {
  latestSavedDraft: 'Saved draft',
  published: 'Published',
}

const getPostID = (post: NewsletterCampaign['post']): number | null =>
  typeof post === 'number' ? post : post?.id || null

const getPostTitle = (post: NewsletterCampaign['post']): string => {
  if (typeof post === 'number') return `Post ${post}`

  return (post as Post | null)?.title || 'Portal post'
}

const formatDate = (value?: string | null): string => {
  if (!value) return 'never'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
