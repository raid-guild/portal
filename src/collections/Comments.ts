import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { authenticated } from '../access/authenticated'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { revalidatePath } from 'next/cache'
import { shouldSkipRevalidation } from '@/utilities/revalidation'

type CommentAccessCache = {
  visibleCommentEventIDs?: (number | string)[]
  visibleCommentProjectIDs?: (number | string)[]
}

type CachedPayloadRequest = PayloadRequest & {
  commentAccessCache?: CommentAccessCache
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    defaultColumns: ['content', 'author', 'parent', 'isApproved', 'createdAt'],
    description: 'Flat comments submitted by visitors on portal content',
    hidden: hideFromNonEditors,
  },
  access: {
    read: async ({ req }) => {
      const { user } = req

      if (canEditContent(user)) {
        return true
      }

      // Event comments inherit event visibility. Project comments are authenticated-only
      // and then inherit project visibility for member/admin scoped projects.
      const visibleEventIDs = await getVisibleEventIDs(req)
      const visibleProjectIDs = await getVisibleProjectIDs(req)

      const publicReadWhere: Where = {
        and: [
          {
            isApproved: {
              equals: true,
            },
          },
          {
            or: [
              {
                'parent.relationTo': {
                  equals: 'posts',
                },
              },
              {
                'parent.relationTo': {
                  equals: 'contributionRequests',
                },
              },
              {
                and: [
                  {
                    'parent.relationTo': {
                      equals: 'events',
                    },
                  },
                  {
                    'parent.value': {
                      in: visibleEventIDs,
                    },
                  },
                ],
              },
              {
                and: [
                  {
                    'parent.relationTo': {
                      equals: 'projects',
                    },
                  },
                  {
                    'parent.value': {
                      in: visibleProjectIDs,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }

      return publicReadWhere
    },
    create: canCreateComment,
    update: ({ req: { user } }) => canEditContent(user),
    delete: ({ req: { user } }) => canEditContent(user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== 'create' || !data || !req.user) return data

        return {
          ...data,
          author: {
            email: req.user.email,
            name: req.user.name || req.user.email,
          },
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (shouldSkipRevalidation(req)) {
          return doc
        }

        if (doc.parent && (operation === 'update' || operation === 'create')) {
          try {
            const parent =
              typeof doc.parent === 'object' && 'relationTo' in doc.parent && 'value' in doc.parent
                ? doc.parent
                : null

            if (!parent) return doc

            const relationTo = parent.relationTo
            const value = parent.value
            const id = typeof value === 'object' ? value.id : value
            const parentDoc = await req.payload.findByID({
              collection: relationTo,
              id,
            })

            const path = getParentPath(relationTo, parentDoc)

            if (path) {
              req.payload.logger.info(`Revalidating comment parent at path: ${path}`)
              revalidatePath(path)
            }
          } catch (error) {
            req.payload.logger.error(
              'Error revalidating comment parent after comment change:',
              error,
            )
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Comment',
      validate: (value: string | undefined) => {
        if (!value || value.length > 2000) return 'Comments cannot be longer than 2000 characters'
        return true
      },
    },
    {
      name: 'author',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          maxLength: 100,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      hasMany: false,
      relationTo: ['posts', 'events', 'projects', 'contributionRequests'],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Visible comments can be hidden by unchecking this field.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData.isApproved && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  timestamps: true,
}

const getParentPath = (
  relationTo: 'contributionRequests' | 'events' | 'posts' | 'projects',
  doc: Record<string, unknown> | null | undefined,
): string | null => {
  if (!doc) return null

  if (relationTo === 'events') {
    return typeof doc.id === 'number' || typeof doc.id === 'string' ? `/events/${doc.id}` : null
  }

  if (typeof doc.slug !== 'string' || !doc.slug) return null

  if (relationTo === 'contributionRequests') return `/requests/${doc.slug}`
  if (relationTo === 'posts') return `/posts/${doc.slug}`
  if (relationTo === 'projects') return `/projects/${doc.slug}`

  return null
}

const getVisibleEventIDs = async (req: PayloadRequest): Promise<(number | string)[]> => {
  const cachedReq = req as CachedPayloadRequest
  cachedReq.commentAccessCache ||= {}

  if (cachedReq.commentAccessCache.visibleCommentEventIDs) {
    return cachedReq.commentAccessCache.visibleCommentEventIDs
  }

  const ids: (number | string)[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await req.payload.find({
      collection: 'events',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      page,
      pagination: true,
      user: req.user || undefined,
    })

    ids.push(...result.docs.map((event) => event.id))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }

  cachedReq.commentAccessCache.visibleCommentEventIDs = ids

  return ids
}

const getVisibleProjectIDs = async (req: PayloadRequest): Promise<(number | string)[]> => {
  if (!req.user) return []

  const cachedReq = req as CachedPayloadRequest
  cachedReq.commentAccessCache ||= {}

  if (cachedReq.commentAccessCache.visibleCommentProjectIDs) {
    return cachedReq.commentAccessCache.visibleCommentProjectIDs
  }

  const ids: (number | string)[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await req.payload.find({
      collection: 'projects',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      page,
      pagination: true,
      user: req.user,
    })

    ids.push(...result.docs.map((project) => project.id))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }

  cachedReq.commentAccessCache.visibleCommentProjectIDs = ids

  return ids
}

async function canCreateComment({ data, req }: { data?: unknown; req: PayloadRequest }) {
  if (!authenticated({ req })) return false

  const parent =
    data && typeof data === 'object' && 'parent' in data
      ? (data.parent as { relationTo?: unknown; value?: unknown } | null)
      : null

  if (!parent || parent.relationTo !== 'projects') return true

  const id =
    typeof parent.value === 'object' && parent.value && 'id' in parent.value
      ? parent.value.id
      : parent.value

  if (typeof id !== 'number' && typeof id !== 'string') return false

  try {
    await req.payload.findByID({
      collection: 'projects',
      id,
      overrideAccess: false,
      user: req.user,
    })

    return true
  } catch {
    return false
  }
}
