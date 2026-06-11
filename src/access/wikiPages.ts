import type { Access, Where } from 'payload'

import { hasRole } from './roles'

const publishedOnly: Where = {
  _status: {
    equals: 'published',
  },
}

export const manageWikiPages: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'editor', 'agent'])

export const readVisibleWikiPages: Access = ({ req: { user } }) => {
  if (hasRole(user, ['admin', 'editor', 'agent'])) return true

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
