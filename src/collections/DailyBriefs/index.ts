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
import { createBriefPublishedNotifications } from './hooks/createBriefPublishedNotifications'
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
    defaultColumns: ['title', 'briefType', 'briefDate', 'visibility', '_status', 'updatedAt'],
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
      name: 'briefType',
      type: 'select',
      admin: {
        description: 'Daily briefs are for authenticated members. Weekly briefs can be public.',
        position: 'sidebar',
      },
      defaultValue: 'daily',
      options: [
        {
          label: 'Daily',
          value: 'daily',
        },
        {
          label: 'Weekly',
          value: 'weekly',
        },
      ],
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'statusLabel',
      type: 'text',
      admin: {
        description: 'Short current-state label for the brief top strip, for example Active Now.',
      },
    },
    {
      name: 'focusLabel',
      type: 'text',
      admin: {
        description:
          'Short focus label for the brief top strip, for example Week 3 - Agent Workflows.',
      },
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
      name: 'mediaFile',
      type: 'upload',
      admin: {
        description:
          'Optional generated media for the brief, such as a Remotion scene export with audio.',
      },
      relationTo: 'media',
    },
    {
      name: 'externalMediaURL',
      type: 'text',
      admin: {
        description: 'Optional externally hosted media URL, such as an S3 or CDN Remotion export.',
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'mediaType',
      type: 'select',
      admin: {
        description: 'Helps the frontend decide how to present the attached media.',
      },
      defaultValue: 'video',
      options: [
        {
          label: 'Video',
          value: 'video',
        },
        {
          label: 'Audio',
          value: 'audio',
        },
        {
          label: 'Remotion Scene',
          value: 'remotion-scene',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    {
      name: 'nextEvent',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'activityItems',
      type: 'relationship',
      hasMany: true,
      relationTo: 'activityItems',
    },
    {
      name: 'threads',
      type: 'relationship',
      hasMany: true,
      relationTo: 'threads',
    },
    {
      name: 'engagementActions',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value) => validateSafeURL(value),
        },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'secondary',
          options: [
            {
              label: 'Primary',
              value: 'primary',
            },
            {
              label: 'Secondary',
              value: 'secondary',
            },
          ],
        },
      ],
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
    afterChange: [createBriefPublishedNotifications],
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
