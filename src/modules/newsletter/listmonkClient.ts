export type ListmonkCampaignInput = {
  altbody: string
  body: string
  fromEmail: string
  listIDs: number[]
  name: string
  subject: string
  templateID: number
}

export type ListmonkCampaign = {
  id: number
  name: string
  status?: string
  uuid?: string
}

type ListmonkClientOptions = {
  apiToken: string
  apiUser: string
  baseURL: string
}

export class ListmonkClient {
  private readonly apiToken: string
  private readonly apiUser: string
  private readonly baseURL: string

  constructor({ apiToken, apiUser, baseURL }: ListmonkClientOptions) {
    this.apiToken = apiToken
    this.apiUser = apiUser
    this.baseURL = baseURL.replace(/\/+$/, '')
  }

  async createCampaign(input: ListmonkCampaignInput): Promise<ListmonkCampaign> {
    const response = await this.request<{ data: ListmonkCampaign }>('/api/campaigns', {
      body: this.toCampaignBody(input),
      method: 'POST',
    })

    return response.data
  }

  async updateCampaign(
    campaignID: number,
    input: ListmonkCampaignInput,
  ): Promise<ListmonkCampaign> {
    const response = await this.request<{ data: ListmonkCampaign }>(
      `/api/campaigns/${campaignID}`,
      {
        body: this.toCampaignBody(input),
        method: 'PUT',
      },
    )

    return response.data
  }

  async sendCampaignTest(
    campaignID: number,
    input: ListmonkCampaignInput,
    emails: string[],
  ): Promise<void> {
    await this.request(`/api/campaigns/${campaignID}/test`, {
      body: {
        ...this.toCampaignBody(input),
        subscribers: emails,
      },
      method: 'POST',
    })
  }

  private toCampaignBody(input: ListmonkCampaignInput) {
    return {
      altbody: input.altbody,
      body: input.body,
      content_type: 'html',
      from_email: input.fromEmail,
      lists: input.listIDs,
      messenger: 'email',
      name: input.name,
      subject: input.subject,
      tags: ['portal-post'],
      template_id: input.templateID,
      type: 'regular',
    }
  }

  private async request<T = unknown>(
    path: string,
    options: {
      body?: unknown
      method: string
    },
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        authorization: `Basic ${Buffer.from(`${this.apiUser}:${this.apiToken}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      method: options.method,
    })

    if (!response.ok) {
      throw new Error(
        `listmonk ${options.method} ${path} failed: ${response.status} ${await response.text()}`,
      )
    }

    const contentType = response.headers.get('content-type') || ''

    return contentType.includes('application/json')
      ? ((await response.json()) as T)
      : ((await response.text()) as T)
  }
}
