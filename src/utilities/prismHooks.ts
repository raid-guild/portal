type TriggerPrismHookArgs = {
  hookKey: string
  payload: Record<string, unknown>
}

type PrismHookTriggerResult = {
  autoStartQueued?: boolean
  changeRequest?: {
    id?: string
    requestNumber?: number
    title?: string
  }
  hook?: {
    key?: string
    name?: string
  }
  ok?: boolean
}

type PrismRequestArtifactsResult = {
  artifacts?: {
    content?: {
      body?: string | null
      encoding?: string | null
      omitted?: boolean
      truncated?: boolean
    } | null
    id?: string
    kind?: string
    mimeType?: string | null
    name?: string
  }[]
  ok?: boolean
  request?: {
    id?: string
    requestNumber?: number
    title?: string
    workflowKey?: string
  }
}

export const triggerPrismHook = async ({
  hookKey,
  payload,
}: TriggerPrismHookArgs): Promise<PrismHookTriggerResult> => {
  const baseURL = getPrismAgentBaseURL()
  const serviceToken = process.env.PRISM_AGENT_SERVICE_TOKEN?.trim()

  if (!baseURL || !serviceToken) {
    throw new PrismHookConfigError('Prism hook integration is not configured.')
  }

  const endpoint = prismHookTriggerURL(baseURL, hookKey)
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'x-service-token': serviceToken,
    },
    method: 'POST',
  })
  const result = (await response.json().catch(() => null)) as
    | (PrismHookTriggerResult & { error?: string })
    | null

  if (!response.ok) {
    throw new Error(result?.error || `Prism hook trigger failed with ${response.status}.`)
  }

  return result || { ok: true }
}

export class PrismHookConfigError extends Error {}

const prismAgentBaseURL = () =>
  process.env.PRISM_AGENT_API_BASE_URL?.trim() ||
  process.env.PRISM_SITE_URL?.trim() ||
  process.env.PRISM_BASE_URL?.trim() ||
  ''

export const getPrismAgentBaseURL = prismAgentBaseURL

export const getPrismRequestArtifactsURL = (requestNumber: number) => {
  const baseURL = getPrismAgentBaseURL()
  if (!baseURL) return null

  const normalizedBaseURL = baseURL.replace(/\/+$/, '')
  const path = `/change-board/requests/by-number/${requestNumber}/artifacts`

  if (normalizedBaseURL.endsWith('/agent')) {
    return `${normalizedBaseURL}${path}`
  }

  return `${normalizedBaseURL}/agent${path}`
}

export const fetchPrismRequestArtifacts = async (
  requestNumber: number,
): Promise<PrismRequestArtifactsResult> => {
  const serviceToken = process.env.PRISM_AGENT_SERVICE_TOKEN?.trim()
  const baseURL = getPrismRequestArtifactsURL(requestNumber)

  if (!baseURL || !serviceToken) {
    throw new PrismHookConfigError('Prism hook integration is not configured.')
  }

  const url = new URL(baseURL)
  url.searchParams.set('includeContent', 'true')
  url.searchParams.set('maxBytes', '2000000')

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'x-service-token': serviceToken,
    },
  })
  const result = (await response.json().catch(() => null)) as
    | (PrismRequestArtifactsResult & { error?: string })
    | null

  if (!response.ok) {
    throw new Error(result?.error || `Prism request artifacts returned ${response.status}.`)
  }

  return result || { ok: true }
}

const prismHookTriggerURL = (baseURL: string, hookKey: string) => {
  const normalizedBaseURL = baseURL.replace(/\/+$/, '')
  const encodedHookKey = encodeURIComponent(hookKey)

  if (normalizedBaseURL.endsWith('/agent')) {
    return `${normalizedBaseURL}/hooks/${encodedHookKey}/trigger`
  }

  return `${normalizedBaseURL}/agent/hooks/${encodedHookKey}/trigger`
}
