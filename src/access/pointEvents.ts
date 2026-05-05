import type { Access, Where } from 'payload'

import { isAdmin } from './roles'

export const adminsOnly: Access = ({ req: { user } }) => isAdmin(user)

export const ownPointEventsOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true

  const ownEvents: Where = {
    recipient: {
      equals: user.id,
    },
  }

  return ownEvents
}
