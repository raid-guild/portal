'use client'

import { CheckCircle2, ExternalLink, MailCheck, RefreshCw, Send, TriangleAlert } from 'lucide-react'
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
  const listCount = listIDs
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length
  const canCreateDraft = Boolean(postID.trim()) && !isCreating
  const canSendTest = Boolean(newsletterCampaignID && testEmail.trim()) && !isSendingTest

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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="portal-kicker">Campaign draft</p>
              <h2 className="mt-2 portal-heading-sm">Portal post to listmonk</h2>
            </div>
            <span className="portal-pill">
              {newsletterCampaignID ? `Record ${newsletterCampaignID}` : 'No draft yet'}
            </span>
          </div>

          <div className="mt-6 grid gap-6">
            <fieldset className="border-t border-border pt-5">
              <legend className="pr-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Source
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-[12rem_1fr]">
                <NewsletterField help="Payload post numeric ID" label="Portal post ID" required>
                  <input
                    className={inputClassName}
                    inputMode="numeric"
                    onChange={(event) => setPostID(event.target.value)}
                    placeholder="68"
                    value={postID}
                  />
                </NewsletterField>
                <NewsletterField help="Blank uses the post title" label="Subject">
                  <input
                    className={inputClassName}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Defaults to post title"
                    value={subject}
                  />
                </NewsletterField>
              </div>
            </fieldset>

            <fieldset className="border-t border-border pt-5">
              <legend className="pr-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Audience
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_16rem]">
                <NewsletterField help="Comma-separated allowlisted list IDs" label="listmonk lists">
                  <input
                    className={inputClassName}
                    onChange={(event) => setListIDs(event.target.value)}
                    placeholder={defaultListIDs.join(',') || '3,4'}
                    value={listIDs}
                  />
                </NewsletterField>
                <div className="border border-border bg-background/40 px-4 py-3">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    Selected lists
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold leading-none text-foreground">
                    {listCount}
                  </p>
                </div>
              </div>
            </fieldset>

            <fieldset className="border-t border-border pt-5">
              <legend className="pr-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Inbox preview
              </legend>
              <div className="mt-4 grid gap-4">
                <NewsletterField help="Short preview line shown by many inboxes" label="Preheader">
                  <input
                    className={inputClassName}
                    onChange={(event) => setPreheader(event.target.value)}
                    placeholder="Optional preview text"
                    value={preheader}
                  />
                </NewsletterField>
                <NewsletterField help="Receives the listmonk test send only" label="Test email">
                  <input
                    className={inputClassName}
                    onChange={(event) => setTestEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={testEmail}
                  />
                </NewsletterField>
              </div>
            </fieldset>
          </div>
        </div>

        <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="portal-kicker">Actions</p>
          <div className="mt-5 grid gap-3">
            <button
              className="portal-admin-link w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCreateDraft}
              onClick={createDraft}
              type="button"
            >
              {isCreating ? (
                <RefreshCw aria-hidden className="animate-spin" size={16} />
              ) : (
                <Send aria-hidden size={16} />
              )}
              {newsletterCampaignID ? 'Update draft' : 'Create draft'}
            </button>
            <button
              className="portal-admin-link w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSendTest}
              onClick={sendTest}
              type="button"
            >
              <MailCheck aria-hidden size={16} />
              Send test
            </button>
            {listmonkCampaignURL ? (
              <a
                className="portal-admin-link w-full justify-center gap-2"
                href={listmonkCampaignURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden size={16} />
                Open in listmonk
              </a>
            ) : null}
          </div>

          <div className="mt-6 border-y border-border py-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Draft</span>
              <span className={newsletterCampaignID ? 'text-emerald-400' : 'text-muted-foreground'}>
                {newsletterCampaignID ? 'Ready' : 'Pending'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Test send</span>
              <span
                className={
                  status.includes('Test sent') ? 'text-emerald-400' : 'text-muted-foreground'
                }
              >
                {status.includes('Test sent') ? 'Sent' : 'Not sent'}
              </span>
            </div>
          </div>

          {status ? (
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-emerald-400">
              <CheckCircle2 aria-hidden className="mt-1 shrink-0" size={16} />
              <span>{status}</span>
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-red-400">
              <TriangleAlert aria-hidden className="mt-1 shrink-0" size={16} />
              <span>{error}</span>
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

const inputClassName =
  'h-11 w-full rounded-sm border border-border bg-background/70 px-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

const NewsletterField: React.FC<{
  children: React.ReactNode
  help?: string
  label: string
  required?: boolean
}> = ({ children, help, label, required }) => (
  <label className="block">
    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
      {label}
      {required ? <span className="text-primary">*</span> : null}
    </span>
    <span className="mt-2 block">{children}</span>
    {help ? (
      <span className="mt-2 block text-xs leading-5 text-muted-foreground">{help}</span>
    ) : null}
  </label>
)
