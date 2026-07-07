import { assertNewsletterConfigured, getNewsletterConfig } from './config'
import { ListmonkClient } from './listmonkClient'

export const getAllowedNewsletterLists = async () => {
  const config = getNewsletterConfig()
  assertNewsletterConfigured(config)

  const listmonk = new ListmonkClient({
    apiToken: config.listmonkAPIToken,
    apiUser: config.listmonkAPIUser,
    baseURL: config.listmonkURL,
  })
  const lists = await listmonk.getLists()
  const allowedIDs = new Set(config.defaultListIDs)

  return lists
    .filter((list) => allowedIDs.has(list.id))
    .map((list) => ({
      id: list.id,
      name: list.name,
      subscriberCount: list.subscriber_count || 0,
      type: list.type || null,
    }))
}
