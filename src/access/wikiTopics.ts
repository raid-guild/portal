import type { Access, Where } from 'payload'

import { canEditContent, hasRole, hasVerifiedAccount } from './roles'

const nonArchived: Where = {
  reviewStatus: {
    not_equals: 'archived',
  },
}

const publicCanonicalStatuses: Where = {
  reviewStatus: {
    in: ['seed', 'reviewed'],
  },
}

const nonAdminVisibility: Where = {
  visibility: {
    not_equals: 'admin',
  },
}

export const createWikiTopics: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'editor', 'agent'])

export const updateWikiTopics: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (hasRole(user, 'agent')) return nonAdminVisibility

  return false
}

export const deleteWikiTopics: Access = ({ req: { user } }) => canEditContent(user)

export const readVisibleWikiTopics: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true

  if (hasRole(user, 'agent')) {
    return {
      and: [nonArchived, nonAdminVisibility],
    }
  }

  if (hasRole(user, 'member')) {
    return {
      and: [nonArchived, nonAdminVisibility],
    }
  }

  if (hasVerifiedAccount(user)) {
    return {
      and: [
        nonArchived,
        {
          visibility: {
            in: ['public', 'authenticated'],
          },
        },
      ],
    }
  }

  return {
    and: [
      publicCanonicalStatuses,
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }
}
