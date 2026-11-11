import { canEditContent, hasRole, hasVerifiedAccount } from './roles'

type EventVisibility = {
  _status?: string | null
  visibility?: string | null
}

type PortalUser = Parameters<typeof canEditContent>[0]

/** Transcript access follows the Event's published visibility. */
export const canReadEventTranscript = (
  event: EventVisibility | null | undefined,
  user: PortalUser,
): boolean => {
  if (canEditContent(user)) return true
  if (!event || event._status !== 'published') return false

  switch (event.visibility) {
    case 'public':
      return true
    case 'authenticated':
      return hasVerifiedAccount(user)
    case 'member':
      return hasRole(user, ['member', 'agent'])
    default:
      return false
  }
}
