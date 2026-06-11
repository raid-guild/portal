import type { Access, Where } from 'payload'

import { hasRole } from './roles'

const publishedOnly: Where = {
  _status: {
    equals: 'published',
  },
}

const nonAdminVisibility: Where = {
  visibility: {
    not_equals: 'admin',
  },
}

export const createWikiPages: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'editor', 'agent'])

export const updateWikiPages: Access = ({ req: { user } }) => {
  if (hasRole(user, ['admin', 'editor'])) return true
  if (hasRole(user, ['agent'])) return nonAdminVisibility

  return false
}

export const readVisibleWikiPages: Access = ({ req: { user } }) => {
  if (hasRole(user, ['admin', 'editor'])) return true

  if (hasRole(user, ['agent'])) {
    return nonAdminVisibility
  }

  if (hasRole(user, ['member'])) {
    return {
      and: [
        publishedOnly,
        {
          visibility: {
            not_equals: 'admin',
          },
        },
      ],
    }
  }

  if (user) {
    return {
      and: [
        publishedOnly,
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
      publishedOnly,
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }
}
