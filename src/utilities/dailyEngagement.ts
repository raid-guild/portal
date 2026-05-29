export const DAILY_VIBE_CHECK_POINTS = 5

export const dailyEngagementVibes = [
  'raiding',
  'ripping',
  'meeting',
  'learning',
  'vibing',
  'blocked',
  'resting',
] as const

export type DailyEngagementVibe = (typeof dailyEngagementVibes)[number]

export const dailyEngagementVibeLabels: Record<DailyEngagementVibe, string> = {
  blocked: 'Blocked',
  meeting: 'Meeting',
  raiding: 'Raiding',
  learning: 'Learning',
  resting: 'Resting',
  ripping: 'Ripping',
  vibing: 'Vibing',
}

export const dailyEngagementVibeEmojis: Record<DailyEngagementVibe, string> = {
  blocked: '🧱',
  meeting: '🗣️',
  raiding: '⚔️',
  learning: '🔎',
  resting: '💤',
  ripping: '🔥',
  vibing: '🌊',
}

export const normalizeEngagementDate = (date = new Date()): string => {
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`
}

export const engagementDateKey = (date?: string | null): string | null => {
  if (!date) return null

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toISOString().slice(0, 10)
}

export const isDailyEngagementVibe = (value: unknown): value is DailyEngagementVibe => {
  return typeof value === 'string' && dailyEngagementVibes.includes(value as DailyEngagementVibe)
}
