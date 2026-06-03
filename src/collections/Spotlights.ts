import type { CollectionConfig, PayloadRequest } from 'payload'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

const visibilityRank: Record<string, number> = {
  public: 0,
  authenticated: 1,
  member: 2,
  private: 3,
  admin: 3,
}

const targetFieldByType = {
  artifact: 'artifactURL',
  event: 'targetEvent',
  external: 'externalURL',
  post: 'targetPost',
  profile: 'targetProfile',
  project: 'targetProject',
  thread: 'targetThread',
} as const

const targetCollectionByType = {
  event: 'events',
  post: 'posts',
  profile: 'profiles',
  project: 'projects',
  thread: 'threads',
} as const

type SpotlightTargetType = keyof typeof targetFieldByType
type SpotlightRelationshipTargetType = keyof typeof targetCollectionByType

const targetFieldAdminCondition = (targetType: string) => (_: unknown, siblingData: unknown) => {
  return (
    siblingData !== null &&
    typeof siblingData === 'object' &&
    'targetType' in siblingData &&
    siblingData.targetType === targetType
  )
}

const getRelationshipID = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    return typeof id === 'number' || typeof id === 'string' ? id : null
  }

  return null
}

const getTargetVisibility = async ({
  req,
  targetType,
  targetValue,
}: {
  req: PayloadRequest
  targetType: SpotlightRelationshipTargetType
  targetValue: unknown
}): Promise<string> => {
  const targetID = getRelationshipID(targetValue)

  if (!targetID) return 'public'

  const target = await req.payload.findByID({
    id: targetID,
    collection: targetCollectionByType[targetType],
    depth: 0,
    overrideAccess: false,
    user: req.user,
  })

  const visibility =
    target && typeof target === 'object' && 'visibility' in target ? target.visibility : null

  return typeof visibility === 'string' ? visibility : 'public'
}

const isVisibilityBroaderThanTarget = (spotlightVisibility: string, targetVisibility: string) => {
  return (visibilityRank[spotlightVisibility] ?? 0) < (visibilityRank[targetVisibility] ?? 0)
}

export const Spotlights: CollectionConfig = {
  slug: 'spotlights',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: readVisiblePortalContent,
    update: contentEditors,
  },
  admin: {
    defaultColumns: ['title', 'kind', 'visibility', '_status', 'startsAt', 'expiresAt', 'priority'],
    group: 'Portal',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'kind',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'featured',
      options: [
        {
          label: 'Featured',
          value: 'featured',
        },
        {
          label: 'Announcement',
          value: 'announcement',
        },
      ],
      required: true,
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'public',
      options: [
        {
          label: 'Public',
          value: 'public',
        },
        {
          label: 'Authenticated',
          value: 'authenticated',
        },
        {
          label: 'Members',
          value: 'member',
        },
        {
          label: 'Admin only',
          value: 'admin',
        },
      ],
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Announcements should usually expire after the relevant event or deadline.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar',
        step: 1,
      },
      defaultValue: 0,
      index: true,
    },
    {
      name: 'targetType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'thread',
      options: [
        {
          label: 'Thread',
          value: 'thread',
        },
        {
          label: 'Session',
          value: 'event',
        },
        {
          label: 'Project',
          value: 'project',
        },
        {
          label: 'Post',
          value: 'post',
        },
        {
          label: 'Profile',
          value: 'profile',
        },
        {
          label: 'External URL',
          value: 'external',
        },
        {
          label: 'Artifact URL',
          value: 'artifact',
        },
      ],
      required: true,
    },
    {
      name: 'targetThread',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('thread'),
      },
      relationTo: 'threads',
    },
    {
      name: 'targetEvent',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('event'),
      },
      relationTo: 'events',
    },
    {
      name: 'targetProject',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('project'),
      },
      relationTo: 'projects',
    },
    {
      name: 'targetPost',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('post'),
      },
      relationTo: 'posts',
    },
    {
      name: 'targetProfile',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('profile'),
      },
      relationTo: 'profiles',
    },
    {
      name: 'externalURL',
      type: 'text',
      admin: {
        condition: targetFieldAdminCondition('external'),
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'artifactURL',
      type: 'text',
      admin: {
        condition: targetFieldAdminCondition('artifact'),
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'ctaLabel',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }

            return value
          },
        ],
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data

        const mergedData = {
          ...(originalDoc || {}),
          ...data,
        } as Record<string, unknown>
        const targetType = mergedData.targetType as SpotlightTargetType | undefined
        const targetField = targetType ? targetFieldByType[targetType] : null

        if (!targetType || !targetField) {
          throw new Error('Choose a valid spotlight target type.')
        }

        const targetValue = mergedData[targetField]

        if (!targetValue) {
          throw new Error(`${targetField} is required for ${targetType} spotlights.`)
        }

        if (targetType === 'external' || targetType === 'artifact') {
          const safeURL = validateSafeURL(String(targetValue), {
            allowRelative: false,
            protocols: ['http:', 'https:'],
          })

          if (safeURL !== true) {
            throw new Error(`${targetField} must be a valid HTTP(S) URL.`)
          }

          return data
        }

        const spotlightVisibility = String(mergedData.visibility || 'public')
        const targetVisibility = await getTargetVisibility({
          req,
          targetType,
          targetValue,
        })

        if (isVisibilityBroaderThanTarget(spotlightVisibility, targetVisibility)) {
          throw new Error('Spotlight visibility cannot be broader than the target visibility.')
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && !data?.createdBy) {
          return {
            ...data,
            createdBy: req.user.id,
          }
        }

        return data
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
