const DEFAULT_LISTMONK_URL = 'https://updates.raidguild.org'
const DEFAULT_PORTAL_URL = 'https://portal.raidguild.org'
const DEFAULT_FROM_EMAIL = 'RaidGuild <updates@updates.raidguild.org>'

export type NewsletterConfig = {
  defaultFromEmail: string
  defaultListIDs: number[]
  defaultTestEmail: string
  listmonkAPIUser: string
  listmonkAPIToken: string
  listmonkTemplateID: number
  listmonkURL: string
  portalURL: string
}

export const getNewsletterConfig = (): NewsletterConfig => ({
  defaultFromEmail: process.env.LISTMONK_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL,
  defaultListIDs: parseNumberList(process.env.LISTMONK_DEFAULT_LIST_IDS),
  defaultTestEmail: process.env.NEWSLETTER_DEFAULT_TEST_EMAIL?.trim() || '',
  listmonkAPIUser: process.env.LISTMONK_API_USER?.trim() || '',
  listmonkAPIToken: process.env.LISTMONK_API_TOKEN?.trim() || '',
  listmonkTemplateID: parsePositiveInteger(process.env.LISTMONK_TEMPLATE_ID),
  listmonkURL: stripTrailingSlash(process.env.LISTMONK_URL?.trim() || DEFAULT_LISTMONK_URL),
  portalURL: stripTrailingSlash(process.env.NEXT_PUBLIC_SERVER_URL?.trim() || DEFAULT_PORTAL_URL),
})

export const assertNewsletterConfigured = (config: NewsletterConfig): void => {
  const missing: string[] = []

  if (!config.listmonkAPIUser) missing.push('LISTMONK_API_USER')
  if (!config.listmonkAPIToken) missing.push('LISTMONK_API_TOKEN')
  if (!config.listmonkTemplateID) missing.push('LISTMONK_TEMPLATE_ID')
  if (!config.defaultListIDs.length) missing.push('LISTMONK_DEFAULT_LIST_IDS')

  if (missing.length) {
    throw new Error(`Newsletter module is missing ${missing.join(', ')}.`)
  }
}

export const parseNumberList = (value: string | undefined): number[] => {
  if (!value) return []

  return value
    .split(',')
    .map((item) => parsePositiveInteger(item))
    .filter((item) => item > 0)
}

export const parsePositiveInteger = (value: unknown): number => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '')
