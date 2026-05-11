import type { Access, Where } from 'payload'

import { canEditContent } from './roles'

const publishedOnly: Where = {
  _status: {
    equals: 'published',
  },
}

export const readVisiblePortalContent: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true

  if (user) {
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
