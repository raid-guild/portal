import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  BlocksFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

import { contentEditors, hasRole } from '@/access/roles'
import { createWikiPages, readVisibleWikiPages, updateWikiPages } from '@/access/wikiPages'
import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const WikiPages: CollectionConfig = {
  slug: 'wikiPages',
  access: {
    create: createWikiPages,
    delete: contentEditors,
    read: readVisibleWikiPages,
    update: updateWikiPages,
  },
  admin: {
    defaultColumns: ['title', 'reviewStatus', 'visibility', '_status', 'lastReviewedAt', 'updatedAt'],
    group: 'Modules',
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
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            UnorderedListFeature(),
            OrderedListFeature(),
            ChecklistFeature(),
            BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Knowledge',
          fields: [
            {
              name: 'keyClaims',
              type: 'array',
              fields: [
                {
                  name: 'claim',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'sourceLabel',
                  type: 'text',
                },
              ],
            },
            {
              name: 'furtherReading',
              type: 'array',
              fields: linkFields('Reference'),
            },
            {
              name: 'papers',
              type: 'array',
              fields: linkFields('Paper'),
            },
            {
              name: 'tools',
              type: 'array',
              fields: linkFields('Tool'),
            },
            {
              name: 'openQuestions',
              type: 'array',
              fields: [
                {
                  name: 'question',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
            {
              name: 'prompts',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'prompt',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
            {
              name: 'relatedTopics',
              type: 'array',
              fields: [
                {
                  name: 'topic',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'possibleTopics',
              type: 'array',
              admin: {
                description:
                  'Mentioned topic targets that do not yet have reviewed wiki pages. Render as possible, not canonical.',
              },
              fields: [
                {
                  name: 'topic',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Sources',
          fields: [
            {
              name: 'sourceSessions',
              type: 'relationship',
              hasMany: true,
              relationTo: 'events',
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
              name: 'relatedThreads',
              type: 'relationship',
              hasMany: true,
              relationTo: 'threads',
            },
            {
              name: 'relatedProfiles',
              type: 'relationship',
              hasMany: true,
              relationTo: 'profiles',
            },
            {
              name: 'relatedActivityItems',
              type: 'relationship',
              hasMany: true,
              relationTo: 'activityItems',
            },
            {
              name: 'sourceArtifacts',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'artifactID',
                  type: 'text',
                },
                {
                  name: 'sourceType',
                  type: 'select',
                  defaultValue: 'prism',
                  options: [
                    {
                      label: 'Prism',
                      value: 'prism',
                    },
                    {
                      label: 'Session',
                      value: 'session',
                    },
                    {
                      label: 'Post',
                      value: 'post',
                    },
                    {
                      label: 'Paper',
                      value: 'paper',
                    },
                    {
                      label: 'Blog',
                      value: 'blog',
                    },
                    {
                      label: 'Hacker News',
                      value: 'hackerNews',
                    },
                    {
                      label: 'Tool',
                      value: 'tool',
                    },
                    {
                      label: 'External',
                      value: 'external',
                    },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  validate: (value) =>
                    validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
                },
                {
                  name: 'sourceQuery',
                  type: 'textarea',
                },
                {
                  name: 'observedAt',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Review',
          fields: [
            {
              name: 'reviewStatus',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'generated_draft',
              index: true,
              options: [
                {
                  label: 'Generated draft',
                  value: 'generated_draft',
                },
                {
                  label: 'Needs review',
                  value: 'needs_review',
                },
                {
                  label: 'Reviewed',
                  value: 'reviewed',
                },
                {
                  label: 'Needs refresh',
                  value: 'needs_refresh',
                },
                {
                  label: 'Archived',
                  value: 'archived',
                },
              ],
              required: true,
            },
            {
              name: 'confidence',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'medium',
              options: [
                {
                  label: 'Low',
                  value: 'low',
                },
                {
                  label: 'Medium',
                  value: 'medium',
                },
                {
                  label: 'High',
                  value: 'high',
                },
              ],
              required: true,
            },
            {
              name: 'lastReviewedAt',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
                position: 'sidebar',
              },
            },
            {
              name: 'lastRefreshedAt',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
                position: 'sidebar',
              },
            },
            {
              name: 'generatedAt',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                position: 'sidebar',
              },
            },
            {
              name: 'promptVersion',
              type: 'text',
            },
            {
              name: 'model',
              type: 'text',
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
            {
              name: 'visibility',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 'authenticated',
              index: true,
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
          ],
        },
      ],
    },
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (
          data?.visibility === 'admin' &&
          hasRole(req.user, ['agent']) &&
          !hasRole(req.user, ['admin', 'editor'])
        ) {
          throw new APIError('Agents cannot create or update admin-only wiki pages.', 403)
        }

        return data
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}

function linkFields(label: string): CollectionConfig['fields'] {
  return [
    {
      name: 'label',
      type: 'text',
      defaultValue: label,
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'note',
      type: 'textarea',
    },
  ]
}
