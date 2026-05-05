import type { Access, Where } from 'payload'

import { canContributeContent, canEditContent } from './roles'

export const createPosts: Access = ({ req: { user } }) => canContributeContent(user)

export const deletePosts: Access = ({ req: { user } }) => canEditContent(user)

export const updatePosts: Access = ({ req: { user } }) => {
  if (!user) return false
  if (canEditContent(user)) return true
  if (!canContributeContent(user)) return false

  const ownDrafts: Where = {
    and: [
      {
        _status: {
          equals: 'draft',
        },
      },
      {
        authors: {
          in: [user.id],
        },
      },
    ],
  }

  return ownDrafts
}
