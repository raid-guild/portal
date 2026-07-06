import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'
import { getNewsletterConfig } from '@/modules/newsletter/config'
import { sendNewsletterCampaignTest } from '@/modules/newsletter/sendCampaignTest'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to send newsletter tests.' }, { status: 401 })
  }

  if (!canEditContent(user)) {
    return Response.json(
      { message: 'Editor access is required to send newsletter tests.' },
      { status: 403 },
    )
  }

  const { id } = await context.params
  const newsletterCampaignID = Number(id)

  if (!Number.isInteger(newsletterCampaignID) || newsletterCampaignID <= 0) {
    return Response.json({ message: 'Valid newsletter campaign ID is required.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const emails = parseEmails(body?.emails || body?.email)

  if (!emails.length) {
    const defaultTestEmail = getNewsletterConfig().defaultTestEmail
    if (defaultTestEmail) emails.push(defaultTestEmail)
  }

  if (!emails.length) {
    return Response.json({ message: 'At least one test email is required.' }, { status: 400 })
  }

  try {
    const campaign = await sendNewsletterCampaignTest({
      emails,
      newsletterCampaignID,
      payload,
      user,
    })

    return Response.json({ campaign })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send newsletter test.'

    return Response.json({ message }, { status: 400 })
  }
}

const parseEmails = (value: unknown): string[] => {
  const rawEmails = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []

  return rawEmails
    .map((email) => (typeof email === 'string' ? email.trim() : ''))
    .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}
