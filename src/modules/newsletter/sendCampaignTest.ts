import type { Payload } from 'payload'

import { getNewsletterConfig } from './config'
import { ListmonkClient } from './listmonkClient'
import type { User } from '@/payload-types'

type SendNewsletterCampaignTestArgs = {
  emails: string[]
  newsletterCampaignID: number
  payload: Payload
  user: User
}

type NewsletterCampaignRecord = {
  id: number
  listmonkCampaignID?: number | null
}

export const sendNewsletterCampaignTest = async ({
  emails,
  newsletterCampaignID,
  payload,
  user,
}: SendNewsletterCampaignTestArgs) => {
  const config = getNewsletterConfig()
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

  const listmonk = new ListmonkClient({
    apiToken: config.listmonkAPIToken,
    apiUser: config.listmonkAPIUser,
    baseURL: config.listmonkURL,
  })

  await listmonk.sendCampaignTest(campaign.listmonkCampaignID, emails)

  return payload.update({
    collection: 'newsletterCampaigns',
    data: {
      lastError: null,
      lastTestEmail: emails.join(', '),
      lastTestSentAt: new Date().toISOString(),
      status: 'test_sent',
      updatedBy: user.id,
    },
    id: newsletterCampaignID,
    overrideAccess: false,
    user,
  })
}
