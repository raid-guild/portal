import type { Access, Where } from 'payload'

import { hasRole, isAdmin } from './roles'

export const adminsOnly: Access = ({ req: { user } }) => isAdmin(user)

export const adminsOrApprovedAgents: Access = ({ req }) => {
  if (isAdmin(req.user)) return true
  if (!hasRole(req.user, 'agent')) return false

  return Boolean((req.context as Record<string, unknown> | undefined)?.allowAgentPointAward)
}

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
