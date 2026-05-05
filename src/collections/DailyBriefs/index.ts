import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import {
  createDailyBriefs,
  deleteDailyBriefs,
  readDailyBriefs,
  updateDailyBriefs,
} from '@/access/dailyBriefs'
import { canEditContent } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'
import { enforceDailyBriefWorkflow } from './hooks/enforceDailyBriefWorkflow'

export const DailyBriefs: CollectionConfig<'dailyBriefs'> = {
  slug: 'dailyBriefs',
  access: {
    create: createDailyBriefs,
    delete: deleteDailyBriefs,
    read: readDailyBriefs,
    update: updateDailyBriefs,
  },
  admin: {
    defaultColumns: ['title', 'briefDate', 'visibility', '_status', 'updatedAt'],
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
      name: 'briefDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        position: 'sidebar',
      },
      index: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              validate: (value) => validateSafeURL(value),
            },
          ],
        },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Optional long-form narrative version of the brief.',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'authenticated',
      options: [
        {
          label: 'Authenticated',
          value: 'authenticated',
        },
        {
          label: 'Public',
          value: 'public',
        },
        {
          label: 'Admin only',
          value: 'admin',
        },
      ],
      required: true,
    },
    {
      name: 'sourceNotes',
      type: 'textarea',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        read: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        description: 'Internal notes, source references, or generation context.',
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'relatedProfiles',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
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
    beforeChange: [enforceDailyBriefWorkflow],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 800,
      },
    },
    maxPerDoc: 50,
  },
}
