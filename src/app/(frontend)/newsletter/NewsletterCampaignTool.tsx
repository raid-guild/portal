'use client'

import { ExternalLink, MailCheck, RefreshCw, Send } from 'lucide-react'
import React, { useState } from 'react'

type DraftResponse = {
  campaign?: {
    id?: number
    listmonkCampaignID?: number
    listmonkCampaignURL?: string
    title?: string
  }
  listmonkCampaign?: {
    id?: number
    name?: string
  }
  message?: string
  postURL?: string
}

type Props = {
  defaultListIDs: number[]
  defaultTestEmail: string
}

export const NewsletterCampaignTool: React.FC<Props> = ({ defaultListIDs, defaultTestEmail }) => {
  const [postID, setPostID] = useState('')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [listIDs, setListIDs] = useState(defaultListIDs.join(','))
  const [testEmail, setTestEmail] = useState(defaultTestEmail)
  const [newsletterCampaignID, setNewsletterCampaignID] = useState<number | null>(null)
  const [listmonkCampaignURL, setListmonkCampaignURL] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  const createDraft = async () => {
    setError('')
    setStatus('')
    setIsCreating(true)

    try {
      const response = await fetch(`/api/newsletter/posts/${encodeURIComponent(postID)}/draft`, {
        body: JSON.stringify({
          listIDs,
          preheader,
          subject,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })
      const body = (await response.json()) as DraftResponse

      if (!response.ok) {
        throw new Error(body.message || 'Failed to create campaign draft.')
      }

      setNewsletterCampaignID(body.campaign?.id || null)
      setListmonkCampaignURL(body.campaign?.listmonkCampaignURL || '')
      setStatus(
        body.listmonkCampaign?.id
          ? `Draft ready in listmonk: ${body.listmonkCampaign.id}`
          : 'Draft ready in listmonk.',
      )
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to create draft.')
    } finally {
      setIsCreating(false)
    }
  }

  const sendTest = async () => {
    if (!newsletterCampaignID) {
      setError('Create a campaign draft before sending a test.')
      return
    }

    setError('')
    setStatus('')
    setIsSendingTest(true)

    try {
      const response = await fetch(`/api/newsletter/campaigns/${newsletterCampaignID}/test`, {
        body: JSON.stringify({
          email: testEmail,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })
      const body = (await response.json()) as DraftResponse

      if (!response.ok) {
        throw new Error(body.message || 'Failed to send test.')
      }

      setStatus(`Test sent to ${testEmail}.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send test.')
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <section className="portal-panel">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>Portal post ID</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            inputMode="numeric"
            onChange={(event) => setPostID(event.target.value)}
            placeholder="68"
            value={postID}
          />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>Audience list IDs</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => setListIDs(event.target.value)}
            placeholder="3,4"
            value={listIDs}
          />
        </label>
        <label className="space-y-2 text-sm font-medium md:col-span-2">
          <span>Subject</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Defaults to post title"
            value={subject}
          />
        </label>
        <label className="space-y-2 text-sm font-medium md:col-span-2">
          <span>Preheader</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => setPreheader(event.target.value)}
            value={preheader}
          />
        </label>
        <label className="space-y-2 text-sm font-medium md:col-span-2">
          <span>Test email</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onChange={(event) => setTestEmail(event.target.value)}
            type="email"
            value={testEmail}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="portal-admin-link inline-flex items-center gap-2"
          disabled={isCreating || !postID}
          onClick={createDraft}
          type="button"
        >
          {isCreating ? <RefreshCw aria-hidden size={16} /> : <Send aria-hidden size={16} />}
          {newsletterCampaignID ? 'Update Draft From Post' : 'Create Campaign Draft'}
        </button>
        <button
          className="portal-admin-link inline-flex items-center gap-2"
          disabled={isSendingTest || !newsletterCampaignID}
          onClick={sendTest}
          type="button"
        >
          <MailCheck aria-hidden size={16} />
          Send Test
        </button>
        {listmonkCampaignURL ? (
          <a
            className="portal-admin-link inline-flex items-center gap-2"
            href={listmonkCampaignURL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden size={16} />
            Open in listmonk
          </a>
        ) : null}
      </div>

      {status ? <p className="mt-5 text-sm text-emerald-400">{status}</p> : null}
      {error ? <p className="mt-5 text-sm text-red-400">{error}</p> : null}
    </section>
  )
}
