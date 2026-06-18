import type { Access, Where } from 'payload'

import { canEditContent, hasRole, hasVerifiedAccount } from './roles'

const publishedOnly: Where = {
  _status: {
    equals: 'published',
  },
}

export const readVisiblePortalContent: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true

  if (hasRole(user, ['member', 'agent'])) {
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

  if (hasVerifiedAccount(user)) {
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
