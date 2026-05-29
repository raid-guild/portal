import type { CollectionConfig } from 'payload'

import {
  canPublishProjectContributionRequest,
  getRelationshipID,
  manageProjectContributionRequests,
  readContributionRequests,
} from '@/access/projectStewards'
import { canContributeContent, contentContributors, hasRole } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const ContributionRequests: CollectionConfig = {
  slug: 'contributionRequests',
  access: {
    create: ({ req: { user } }) => canContributeContent(user) || hasRole(user, 'member'),
    delete: contentContributors,
    read: readContributionRequests,
    update: manageProjectContributionRequests,
  },
  admin: {
    defaultColumns: ['title', 'requestType', 'requestStatus', 'project', 'visibility', '_status'],
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
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: 'Longer context, constraints, and response instructions for the ask.',
      },
    },
    {
      name: 'requestStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'open',
      index: true,
      options: [
        {
          label: 'Open',
          value: 'open',
        },
        {
          label: 'In discussion',
          value: 'in_discussion',
        },
        {
          label: 'Filled',
          value: 'filled',
        },
        {
          label: 'Paused',
          value: 'paused',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'requestType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'help_wanted',
      index: true,
      options: [
        {
          label: 'Good first contribution',
          value: 'good_first_contribution',
        },
        {
          label: 'Help wanted',
          value: 'help_wanted',
        },
        {
          label: 'Review',
          value: 'review',
        },
        {
          label: 'Feedback',
          value: 'feedback',
        },
        {
          label: 'Collaborator',
          value: 'collaborator',
        },
        {
          label: 'Resource',
          value: 'resource',
        },
      ],
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
      required: true,
    },
    {
      name: 'project',
      type: 'relationship',
      admin: {
        description: 'Primary project context for project-local display.',
        position: 'sidebar',
      },
      relationTo: 'projects',
    },
    {
      name: 'relatedEvents',
      type: 'relationship',
      admin: {
        description: 'Sessions or events this request came from or should display on.',
      },
      hasMany: true,
      relationTo: 'events',
    },
    {
      name: 'relatedThreads',
      type: 'relationship',
      hasMany: true,
      relationTo: 'threads',
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
    },
    {
      name: 'relatedProfiles',
      type: 'relationship',
      admin: {
        description: 'People who provide context, are referenced, or may be useful contacts.',
      },
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'profileSkills',
      type: 'relationship',
      admin: {
        description: 'Skills or roles that would help with this request.',
      },
      hasMany: true,
      relationTo: 'profileSkills',
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'public',
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
          label: 'Admin',
          value: 'admin',
        },
      ],
      required: true,
    },
    {
      name: 'responseURL',
      type: 'text',
      admin: {
        description: 'Where someone should respond, such as Discord, GitHub, or a form.',
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: true, protocols: ['http:', 'https:'] }),
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
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (!req.user) return data
        const projectID = getRelationshipID(data.project) || getRelationshipID(originalDoc?.project)
        const canPublish = await canPublishProjectContributionRequest({
          projectID,
          req,
        })

        if (canPublish) return data

        const nextData = {
          ...data,
        }

        const isPublishedUpdate =
          operation === 'update' &&
          (originalDoc?._status === 'published' || nextData._status === 'published')

        if (isPublishedUpdate) {
          throw new Error(
            'Only editors, admins, agents, and project stewards can update published contribution requests.',
          )
        }

        if (operation === 'create') {
          nextData._status = 'draft'
        }

        nextData.publishedAt = undefined

        if (nextData._status === 'published') {
          throw new Error(
            'Only editors, admins, agents, and project stewards can publish contribution requests.',
          )
        }

        if (nextData.requestStatus === 'archived') {
          throw new Error(
            'Only editors, admins, agents, and project stewards can archive contribution requests.',
          )
        }

        return nextData
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
