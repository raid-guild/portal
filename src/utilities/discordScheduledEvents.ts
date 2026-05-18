import type { Event } from '@/payload-types'

type DiscordScheduledEvent = {
  id: string
  guild_id: string
}

type CreateDiscordEventArgs = {
  description?: string | null
  endsAt: string
  locationLabel?: string | null
  startsAt: string
  title: string
}

const DISCORD_API_BASE = 'https://discord.com/api/v10'

export const canCreateDiscordScheduledEvents = (): boolean => {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID)
}

export const createDiscordScheduledEvent = async ({
  description,
  endsAt,
  locationLabel,
  startsAt,
  title,
}: CreateDiscordEventArgs): Promise<Pick<Event, 'discordEventURL' | 'discordScheduledEventID'>> => {
  const token = process.env.DISCORD_BOT_TOKEN
  const guildID = process.env.DISCORD_GUILD_ID

  if (!token || !guildID) {
    throw new Error('Discord scheduled event sync is not configured.')
  }

  const channelID = process.env.DISCORD_SCHEDULED_EVENT_CHANNEL_ID
  const isVoiceEvent = Boolean(channelID)
  const body = {
    channel_id: channelID || null,
    description: description || undefined,
    entity_metadata: isVoiceEvent
      ? null
      : {
          location: (locationLabel || 'RaidGuild Portal').slice(0, 100),
        },
    entity_type: isVoiceEvent ? 2 : 3,
    name: title.slice(0, 100),
    privacy_level: 2,
    scheduled_end_time: endsAt,
    scheduled_start_time: startsAt,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  let response: Response

  try {
    response = await fetch(`${DISCORD_API_BASE}/guilds/${guildID}/scheduled-events`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': 'Created from RaidGuild Portal',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Discord scheduled event sync timed out.')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const message = await response.text().catch(() => '')

    throw new Error(message || `Discord scheduled event sync failed with ${response.status}.`)
  }

  const event = (await response.json()) as DiscordScheduledEvent

  return {
    discordEventURL: `https://discord.com/events/${event.guild_id}/${event.id}`,
    discordScheduledEventID: event.id,
  }
}
