import type { Access } from 'payload'

import { canEditContent, isAdmin } from './roles'

/**
 * All writes go through `src/app/(frontend)/api/reactions/route.ts` with
 * `overrideAccess: true`, because anonymous visitors have no Payload user and must
 * not get blanket create rights on this collection.
 */
export const createContentReactions: Access = () => false

/**
 * Editors see everything (analytics in the admin); a signed-in member sees only their
 * own rows; an anonymous request has no Payload user and gets nothing. Public like
 * counts never come from this — they come from a server-side `payload.count` with
 * `overrideAccess: true`.
 */
export const readContentReactions: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    user: {
      equals: user.id,
    },
  }
}

export const updateContentReactions: Access = ({ req: { user } }) => canEditContent(user)

export const deleteContentReactions: Access = ({ req: { user } }) => isAdmin(user)
