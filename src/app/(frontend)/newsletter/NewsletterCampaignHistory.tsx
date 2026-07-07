'use client'

import { ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import type { NewsletterCampaign, Post } from '@/payload-types'

export const NewsletterCampaignHistory: React.FC<{ campaigns: NewsletterCampaign[] }> = ({
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
          <NewsletterCampaignHistoryItem campaign={campaign} key={campaign.id} />
        ))}
      </div>
    ) : (
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        No Portal newsletter campaign records exist yet.
      </p>
    )}
  </section>
)

const NewsletterCampaignHistoryItem: React.FC<{ campaign: NewsletterCampaign }> = ({
  campaign,
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [listmonkCampaignURL, setListmonkCampaignURL] = useState(campaign.listmonkCampaignURL || '')
  const postID = getPostID(campaign.post)

  const updateDraft = async () => {
    if (!postID) {
      setError('This campaign is missing its Portal post.')
      return
    }

    setIsUpdating(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`/api/newsletter/posts/${postID}/draft`, {
        body: JSON.stringify({
          listIDs: campaign.listIDs.map((item) => item.listID).join(','),
          preheader: campaign.preheader || '',
          sourceMode: campaign.sourceMode,
          subject: campaign.subject,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })
      const body = (await response.json()) as {
        campaign?: NewsletterCampaign
        listmonkCampaign?: { id?: number }
        message?: string
      }

      if (!response.ok) {
        throw new Error(body.message || 'Failed to update campaign draft.')
      }

      setListmonkCampaignURL(body.campaign?.listmonkCampaignURL || listmonkCampaignURL)
      setMessage(
        body.listmonkCampaign?.id
          ? `Draft updated in listmonk: ${body.listmonkCampaign.id}`
          : 'Draft updated in listmonk.',
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Failed to update campaign draft.',
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <article className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
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
          Synced {formatDate(campaign.lastSyncedAt)} / tested {formatDate(campaign.lastTestSentAt)}
        </p>
        {campaign.lastError ? (
          <p className="mt-3 text-sm leading-6 text-red-400">{campaign.lastError}</p>
        ) : null}
        {message ? <p className="mt-3 text-sm leading-6 text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm leading-6 text-red-400">{error}</p> : null}
      </div>
      <div className="flex flex-wrap items-start gap-2 lg:justify-end">
        <button
          className="portal-admin-link gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isUpdating || !postID}
          onClick={updateDraft}
          type="button"
        >
          <RefreshCw aria-hidden className={isUpdating ? 'animate-spin' : ''} size={16} />
          Update draft
        </button>
        <Link className="portal-admin-link" href={`/newsletter?postId=${postID || ''}`}>
          Edit settings
        </Link>
        {listmonkCampaignURL ? (
          <a
            className="portal-admin-link gap-2"
            href={listmonkCampaignURL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden size={16} />
            Open in listmonk
          </a>
        ) : null}
      </div>
    </article>
  )
}

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
