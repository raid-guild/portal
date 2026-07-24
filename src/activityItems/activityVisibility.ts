import type { ActivityItem } from '@/payload-types'

export const toActivityVisibility = (
  visibility?: string | null,
): ActivityItem['visibility'] | null => {
  if (visibility === 'admin') return null
  if (visibility === 'public') return 'public'

  return 'authenticated'
}
