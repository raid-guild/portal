import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { canEditContent, hasVerifiedAccount } from '@/access/roles'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import { getNewsletterConfig } from '@/modules/newsletter/config'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { NewsletterCampaignHistory } from './NewsletterCampaignHistory'
import { NewsletterCampaignTool } from './NewsletterCampaignTool'
import type { NewsletterCampaign } from '@/payload-types'

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
  const initialCampaign =
    canCreateCampaigns && initialPostID
      ? await getNewsletterCampaignByPostID(user, Number(initialPostID))
      : null

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
            initialCampaign={initialCampaign}
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

const getNewsletterCampaignByPostID = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  postID: number,
) => {
  if (!Number.isInteger(postID) || postID <= 0) return null

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'newsletterCampaigns',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      post: {
        equals: postID,
      },
    },
  })

  return (result.docs[0] as NewsletterCampaign | undefined) || null
}
