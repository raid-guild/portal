import type { Payload } from 'payload'

import { assertNewsletterConfigured, getNewsletterConfig } from './config'
import type { ListmonkCampaignInput } from './listmonkClient'
import { ListmonkClient } from './listmonkClient'
import { renderPortalPostEmail } from './renderPortalPostEmail'
import type { User } from '@/payload-types'

type SendNewsletterCampaignTestArgs = {
  emails: string[]
  newsletterCampaignID: number
  payload: Payload
  user: User
}

type NewsletterCampaignRecord = {
  fromEmail?: string | null
  id: number
  listIDs?: { listID?: number | null }[] | null
  listmonkCampaignID?: number | null
  post?: number | { id?: number | null } | null
  preheader?: string | null
  subject?: string | null
  templateID?: number | null
  title?: string | null
}

export const sendNewsletterCampaignTest = async ({
  emails,
  newsletterCampaignID,
  payload,
  user,
}: SendNewsletterCampaignTestArgs) => {
  const config = getNewsletterConfig()
  assertNewsletterConfigured(config)

  const campaign = (await payload.findByID({
    collection: 'newsletterCampaigns',
    depth: 0,
    id: newsletterCampaignID,
    overrideAccess: false,
    user,
  })) as NewsletterCampaignRecord

  if (!campaign.listmonkCampaignID) {
    throw new Error('Create a listmonk campaign draft before sending a test.')
  }

  const postID = getRelationshipID(campaign.post)

  if (!postID) {
    throw new Error('Newsletter campaign is missing its Portal post.')
  }

  const post = await payload.findByID({
    collection: 'posts',
    depth: 3,
    id: postID,
    overrideAccess: false,
    user,
  })
  const subject = campaign.subject || stringValue(post.title) || `Portal post ${postID}`
  const rendered = renderPortalPostEmail({
    portalURL: config.portalURL,
    post,
    preheader: campaign.preheader || '',
    subject,
  })
  const listIDs = campaign.listIDs?.map((item) => item.listID).filter(isPositiveNumber)

  const listmonk = new ListmonkClient({
    apiToken: config.listmonkAPIToken,
    apiUser: config.listmonkAPIUser,
    baseURL: config.listmonkURL,
  })

  const campaignInput: ListmonkCampaignInput = {
    altbody: rendered.text,
    body: rendered.html,
    fromEmail: campaign.fromEmail || config.defaultFromEmail,
    listIDs: listIDs?.length ? listIDs : config.defaultListIDs,
    name: campaign.title || `Portal post ${postID}: ${subject}`,
    subject,
    templateID: campaign.templateID || config.listmonkTemplateID,
  }
  const listmonkCampaign = await listmonk.updateCampaign(campaign.listmonkCampaignID, campaignInput)

  await listmonk.sendCampaignTest(campaign.listmonkCampaignID, campaignInput, emails)

  return payload.update({
    collection: 'newsletterCampaigns',
    data: {
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
      lastTestEmail: emails.join(', '),
      lastTestSentAt: new Date().toISOString(),
      listmonkCampaignUUID: listmonkCampaign.uuid || null,
      status: 'test_sent',
      updatedBy: user.id,
    },
    id: newsletterCampaignID,
    overrideAccess: false,
    user,
  })
}

const getRelationshipID = (value: NewsletterCampaignRecord['post']): number => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && typeof value.id === 'number') return value.id

  return 0
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

const stringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
