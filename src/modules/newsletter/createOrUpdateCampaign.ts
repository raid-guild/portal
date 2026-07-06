import type { Payload } from 'payload'

import { assertNewsletterConfigured, getNewsletterConfig, parseNumberList } from './config'
import { ListmonkClient } from './listmonkClient'
import { renderPortalPostEmail } from './renderPortalPostEmail'
import type { User } from '@/payload-types'

type CreateOrUpdateNewsletterCampaignArgs = {
  payload: Payload
  postID: number
  requestBody?: unknown
  user: User
}

type NewsletterCampaignRecord = {
  id: number
  listmonkCampaignID?: number | null
}

export type NewsletterSourceMode = 'latestSavedDraft' | 'published'

export const createOrUpdateNewsletterCampaign = async ({
  payload,
  postID,
  requestBody,
  user,
}: CreateOrUpdateNewsletterCampaignArgs) => {
  const config = getNewsletterConfig()
  assertNewsletterConfigured(config)

  const body = typeof requestBody === 'object' && requestBody !== null ? requestBody : {}
  const subjectOverride = stringValue((body as { subject?: unknown }).subject)
  const preheader = stringValue((body as { preheader?: unknown }).preheader)
  const requestedListIDs = parseNumberListFromUnknown((body as { listIDs?: unknown }).listIDs)
  const sourceMode = parseSourceMode((body as { sourceMode?: unknown }).sourceMode)
  const listIDs = requestedListIDs.length ? requestedListIDs : config.defaultListIDs
  const templateID = config.listmonkTemplateID
  const fromEmail = config.defaultFromEmail

  validateAllowedListIDs(listIDs, config.defaultListIDs)

  const post = await payload.findByID({
    collection: 'posts',
    depth: 3,
    draft: sourceMode === 'latestSavedDraft',
    id: postID,
    overrideAccess: false,
    user,
  })
  const subject = subjectOverride || stringValue(post.title) || `Portal post ${postID}`
  const title = `Portal post ${postID}: ${subject}`
  const rendered = renderPortalPostEmail({
    portalURL: config.portalURL,
    post,
    preheader,
    subject,
  })
  const campaignName = title
  const existing = await findExistingCampaignRecord({ payload, postID, user })
  const listmonk = new ListmonkClient({
    apiToken: config.listmonkAPIToken,
    apiUser: config.listmonkAPIUser,
    baseURL: config.listmonkURL,
  })

  try {
    const listmonkCampaign = existing?.listmonkCampaignID
      ? await listmonk.updateCampaign(existing.listmonkCampaignID, {
          altbody: rendered.text,
          body: rendered.html,
          fromEmail,
          listIDs,
          name: campaignName,
          subject,
          templateID,
        })
      : await listmonk.createCampaign({
          altbody: rendered.text,
          body: rendered.html,
          fromEmail,
          listIDs,
          name: campaignName,
          subject,
          templateID,
        })

    const recordData = {
      fromEmail,
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
      listIDs: listIDs.map((listID) => ({ listID })),
      listmonkCampaignID: listmonkCampaign.id,
      listmonkCampaignURL: `${config.listmonkURL}/admin/campaigns/${listmonkCampaign.id}`,
      listmonkCampaignUUID: listmonkCampaign.uuid || null,
      post: postID,
      preheader: preheader || null,
      sourceMode,
      status: 'draft' as const,
      subject,
      templateID,
      title,
      updatedBy: user.id,
    }

    const record = existing
      ? await payload.update({
          collection: 'newsletterCampaigns',
          data: recordData,
          id: existing.id,
          overrideAccess: false,
          user,
        })
      : await payload.create({
          collection: 'newsletterCampaigns',
          data: {
            ...recordData,
            createdBy: user.id,
          },
          overrideAccess: false,
          user,
        })

    return {
      campaign: record,
      listmonkCampaign,
      rendered,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown newsletter campaign error.'

    if (existing) {
      await payload.update({
        collection: 'newsletterCampaigns',
        data: {
          lastError: message,
          status: 'error',
          updatedBy: user.id,
        },
        id: existing.id,
        overrideAccess: false,
        user,
      })
    }

    throw error
  }
}

const findExistingCampaignRecord = async ({
  payload,
  postID,
  user,
}: {
  payload: Payload
  postID: number
  user: User
}): Promise<NewsletterCampaignRecord | null> => {
  const result = await payload.find({
    collection: 'newsletterCampaigns',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      post: {
        equals: postID,
      },
    },
  })

  return (result.docs[0] as NewsletterCampaignRecord | undefined) || null
}

const validateAllowedListIDs = (listIDs: number[], allowedListIDs: number[]): void => {
  const disallowed = listIDs.filter((listID) => !allowedListIDs.includes(listID))

  if (disallowed.length) {
    throw new Error(
      `List IDs are not allowlisted for Portal newsletter use: ${disallowed.join(', ')}`,
    )
  }
}

const parseNumberListFromUnknown = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
  }

  return parseNumberList(typeof value === 'string' ? value : undefined)
}

export const parseSourceMode = (value: unknown): NewsletterSourceMode =>
  value === 'published' ? 'published' : 'latestSavedDraft'

const stringValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
