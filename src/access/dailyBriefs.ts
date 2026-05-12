import type { Access, Where } from 'payload'

import { canContributeContent, canEditContent } from './roles'

export const createDailyBriefs: Access = ({ req: { user } }) => canContributeContent(user)

export const deleteDailyBriefs: Access = ({ req: { user } }) => canEditContent(user)

export const readDailyBriefs: Access = ({ req: { user } }) => {
  if (user) return true

  const publicWeeklyBriefs: Where = {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        briefType: {
          equals: 'weekly',
        },
      },
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }

  return publicWeeklyBriefs
}

export const updateDailyBriefs: Access = ({ req: { user } }) => {
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
