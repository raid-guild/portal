import type { CollectionConfig, Where } from 'payload'
import { authenticated } from '../access/authenticated'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { revalidatePath } from 'next/cache'
import { shouldSkipRevalidation } from '@/utilities/revalidation'

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

      if (user) {
        return true
      }

      const visibleEvents = await req.payload.find({
        collection: 'events',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        where: {
          and: [
            {
              _status: {
                equals: 'published',
              },
            },
            {
              visibility: {
                equals: 'public',
              },
            },
          ],
        },
      })
      const visibleEventIDs = visibleEvents.docs.map((event) => event.id)

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
                  not_equals: 'events',
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
            ],
          },
        ],
      }

      return publicReadWhere
    },
    create: authenticated,
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
