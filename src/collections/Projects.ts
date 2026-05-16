import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentContributors } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: authenticated,
    delete: contentContributors,
    read: readVisiblePortalContent,
    update: contentContributors,
  },
  admin: {
    defaultColumns: [
      'title',
      'slug',
      'projectKind',
      'projectStatus',
      'visibility',
      'reviewStatus',
      'confidence',
      'lastActiveAt',
      'isFeatured',
      '_status',
      'updatedAt',
    ],
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
      name: 'description',
      type: 'richText',
    },
    {
      name: 'projectStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Building',
          value: 'building',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
        {
          label: 'Exploratory',
          value: 'exploratory',
        },
        {
          label: 'Exploring',
          value: 'exploring',
        },
        {
          label: 'Shipping',
          value: 'shipping',
        },
      ],
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
    },
    {
      name: 'projectKind',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'unknown',
      index: true,
      options: [
        {
          label: 'RaidGuild Project',
          value: 'raidguild-project',
        },
        {
          label: 'Client Artifact',
          value: 'client-artifact',
        },
        {
          label: 'Internal Tool',
          value: 'internal-tool',
        },
        {
          label: 'Reference Repo',
          value: 'reference-repo',
        },
        {
          label: 'RIP',
          value: 'rip',
        },
        {
          label: 'Cohort Project',
          value: 'cohort-project',
        },
        {
          label: 'Experiment',
          value: 'experiment',
        },
        {
          label: 'Template',
          value: 'template',
        },
        {
          label: 'Unknown',
          value: 'unknown',
        },
      ],
    },
    {
      name: 'reviewStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'unreviewed',
      index: true,
      options: [
        {
          label: 'Unreviewed',
          value: 'unreviewed',
        },
        {
          label: 'Needs Review',
          value: 'needs-review',
        },
        {
          label: 'In Review',
          value: 'in-review',
        },
        {
          label: 'Needs More Evidence',
          value: 'needs-more-evidence',
        },
        {
          label: 'Ready for Prism',
          value: 'ready-for-prism',
        },
        {
          label: 'Ready for CMS',
          value: 'ready-for-cms',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
    },
    {
      name: 'confidence',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'low',
      index: true,
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
    },
    {
      name: 'historicalRelevance',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'unknown',
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
        {
          label: 'Unknown',
          value: 'unknown',
        },
      ],
    },
    {
      name: 'claimedBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description:
          'Best-known project start date. For imported archives, this usually comes from repo creation or earliest source evidence.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'launchedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Best-known launch, delivery, or public release date.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Best-known completion, sunset, or handoff date.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'currentState',
      type: 'array',
      fields: [
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'lastActiveAt',
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
      name: 'isFeatured',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
    {
      name: 'featuredFrom',
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
      name: 'featuredUntil',
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
      name: 'featuredPriority',
      type: 'number',
      admin: {
        description: 'Higher values surface first when multiple projects are featured.',
        position: 'sidebar',
      },
      defaultValue: 0,
      index: true,
    },
    {
      name: 'primaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'url',
          type: 'text',
          validate: (value) => validateSafeURL(value),
        },
      ],
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
          validate: (value) =>
            validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contributors',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'canonicalProject',
      type: 'relationship',
      admin: {
        description:
          'Use when this record is a repo, artifact, or duplicate that belongs under a primary project.',
      },
      relationTo: 'projects',
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      admin: {
        description:
          'Related project records, component repos, companion artifacts, or follow-on work.',
      },
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'confidenceRationale',
      type: 'textarea',
      admin: {
        description: 'Why the current confidence level is justified.',
      },
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
        {
          name: 'status',
          type: 'select',
          defaultValue: 'open',
          options: [
            {
              label: 'Open',
              value: 'open',
            },
            {
              label: 'Answered',
              value: 'answered',
            },
            {
              label: 'Not Applicable',
              value: 'not-applicable',
            },
          ],
        },
        {
          name: 'answer',
          type: 'textarea',
        },
        {
          name: 'answeredBy',
          type: 'relationship',
          relationTo: 'profiles',
        },
        {
          name: 'answeredAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'sourceURL',
          type: 'text',
          validate: (value) =>
            validateSafeURL(value, { allowRelative: true, protocols: ['http:', 'https:'] }),
        },
      ],
    },
    {
      name: 'sourceEvidence',
      type: 'array',
      admin: {
        description:
          'Raw evidence used by importers and reviewers. Keep this separate from curated public links.',
      },
      fields: [
        {
          name: 'sourceType',
          type: 'select',
          required: true,
          options: [
            {
              label: 'GitHub',
              value: 'github',
            },
            {
              label: 'Discord',
              value: 'discord',
            },
            {
              label: 'Valhalla',
              value: 'valhalla',
            },
            {
              label: 'RIP',
              value: 'rip',
            },
            {
              label: 'Charmverse',
              value: 'charmverse',
            },
            {
              label: 'Website',
              value: 'website',
            },
            {
              label: 'Docs',
              value: 'docs',
            },
            {
              label: 'Other',
              value: 'other',
            },
          ],
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          validate: (value) =>
            validateSafeURL(value, { allowRelative: true, protocols: ['http:', 'https:'] }),
        },
        {
          name: 'sourceID',
          type: 'text',
        },
        {
          name: 'confidence',
          type: 'select',
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
        },
        {
          name: 'notes',
          type: 'textarea',
        },
        {
          name: 'firstSeenAt',
          type: 'date',
        },
        {
          name: 'lastSeenAt',
          type: 'date',
        },
      ],
    },
    {
      name: 'peopleEvidence',
      type: 'array',
      admin: {
        description:
          'Candidate people extracted from commits, Discord, or docs before they are promoted to contributors.',
      },
      fields: [
        {
          name: 'handle',
          type: 'text',
          required: true,
        },
        {
          name: 'role',
          type: 'text',
        },
        {
          name: 'profile',
          type: 'relationship',
          relationTo: 'profiles',
        },
        {
          name: 'sourceType',
          type: 'select',
          required: true,
          options: [
            {
              label: 'GitHub',
              value: 'github',
            },
            {
              label: 'Discord',
              value: 'discord',
            },
            {
              label: 'Valhalla',
              value: 'valhalla',
            },
            {
              label: 'RIP',
              value: 'rip',
            },
            {
              label: 'Charmverse',
              value: 'charmverse',
            },
            {
              label: 'Other',
              value: 'other',
            },
          ],
        },
        {
          name: 'sourceURL',
          type: 'text',
          validate: (value) =>
            validateSafeURL(value, { allowRelative: true, protocols: ['http:', 'https:'] }),
        },
        {
          name: 'confidence',
          type: 'select',
          defaultValue: 'low',
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
        },
        {
          name: 'notes',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'profileSkills',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profileSkills',
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
      name: 'events',
      type: 'relationship',
      hasMany: true,
      relationTo: 'events',
    },
    {
      name: 'resources',
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
          validate: (value) =>
            validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
        },
        {
          name: 'resourceType',
          type: 'select',
          defaultValue: 'link',
          options: [
            {
              label: 'Link',
              value: 'link',
            },
            {
              label: 'Repository',
              value: 'repo',
            },
            {
              label: 'Design',
              value: 'design',
            },
            {
              label: 'Document',
              value: 'doc',
            },
            {
              label: 'Calendar',
              value: 'calendar',
            },
            {
              label: 'Discord',
              value: 'discord',
            },
          ],
        },
      ],
    },
    {
      name: 'contributionActions',
      type: 'array',
      fields: [
        {
          name: 'title',
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
      ],
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
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
