import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  createWikiTopics,
  deleteWikiTopics,
  readVisibleWikiTopics,
  updateWikiTopics,
} from '@/access/wikiTopics'
import { hasRole } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

const sourceTypeOptions = [
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
] as const

export const WikiTopics: CollectionConfig = {
  slug: 'wikiTopics',
  access: {
    create: createWikiTopics,
    delete: deleteWikiTopics,
    read: readVisibleWikiTopics,
    update: updateWikiTopics,
  },
  admin: {
    defaultColumns: ['title', 'kind', 'reviewStatus', 'visibility', 'parentTopic', 'updatedAt'],
    group: 'Modules',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
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
      defaultValue: 'topic',
      index: true,
      options: [
        {
          label: 'Category',
          value: 'category',
        },
        {
          label: 'Topic',
          value: 'topic',
        },
        {
          label: 'Subtopic',
          value: 'subtopic',
        },
        {
          label: 'Possible',
          value: 'possible',
        },
      ],
      required: true,
    },
    {
      name: 'parentTopic',
      type: 'relationship',
      admin: {
        description: 'Optional parent for discovery-tree zoom in/out behavior.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'wikiTopics',
    },
    {
      name: 'relatedTopics',
      type: 'relationship',
      admin: {
        description: 'Lateral graph links. Use parentTopic for hierarchy.',
      },
      hasMany: true,
      relationTo: 'wikiTopics',
    },
    {
      name: 'canonicalPage',
      type: 'relationship',
      admin: {
        description: 'Primary wiki article for this topic, when one exists.',
      },
      relationTo: 'wikiPages',
    },
    {
      name: 'relatedPages',
      type: 'relationship',
      admin: {
        description: 'Additional wiki articles connected to this topic.',
      },
      hasMany: true,
      relationTo: 'wikiPages',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Discovery',
          fields: [
            {
              name: 'sourceSessions',
              type: 'relationship',
              hasMany: true,
              relationTo: 'events',
            },
            {
              name: 'expansionPrompt',
              type: 'textarea',
              admin: {
                description:
                  'Optional steering prompt used when Prism expands this topic. Falls back to the module default when empty.',
              },
            },
            {
              name: 'sourceQueries',
              type: 'array',
              fields: [
                {
                  name: 'query',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'filters',
                  type: 'textarea',
                },
                {
                  name: 'resultCount',
                  type: 'number',
                },
                {
                  name: 'searchedAt',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
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
                  options: [...sourceTypeOptions],
                },
                {
                  name: 'url',
                  type: 'text',
                  validate: (value) =>
                    validateSafeURL(value, {
                      allowRelative: false,
                      protocols: ['http:', 'https:'],
                    }),
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
              defaultValue: 'suggested',
              index: true,
              options: [
                {
                  label: 'Seed',
                  value: 'seed',
                },
                {
                  label: 'Suggested',
                  value: 'suggested',
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
            {
              name: 'sortOrder',
              type: 'number',
              admin: {
                position: 'sidebar',
              },
              defaultValue: 0,
            },
            {
              name: 'lastExpandedAt',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                position: 'sidebar',
              },
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
              name: 'generatedBy',
              type: 'relationship',
              relationTo: 'users',
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
      ({ data, originalDoc, req }) => {
        const nextVisibility = data?.visibility ?? originalDoc?.visibility
        const nextReviewStatus = data?.reviewStatus ?? originalDoc?.reviewStatus

        if (
          nextVisibility === 'admin' &&
          hasRole(req.user, ['agent']) &&
          !hasRole(req.user, ['admin', 'editor'])
        ) {
          throw new APIError('Agents cannot create or update admin-only wiki topics.', 403)
        }

        if (
          nextReviewStatus === 'reviewed' &&
          hasRole(req.user, ['agent']) &&
          !hasRole(req.user, ['admin', 'editor'])
        ) {
          throw new APIError('Agents cannot mark wiki topics as reviewed.', 403)
        }

        return data
      },
    ],
  },
  timestamps: true,
}
