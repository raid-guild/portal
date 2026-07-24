import type { CollectionConfig } from 'payload'

import { getProfileIDsForUser } from '@/access/projectStewards'
import { readVisiblePortalContent } from '@/access/portalVisibility'
import { canContributeContent, contentContributors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'
import { createEventPublishedNotifications } from './Events/hooks/createEventPublishedNotifications'
import { recordEventPublishedActivity } from './Events/hooks/recordEventPublishedActivity'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: contentContributors,
    delete: contentContributors,
    read: readVisiblePortalContent,
    update: async ({ req }) => {
      if (canContributeContent(req.user)) return true

      const profileIDs = await getProfileIDsForUser(req)

      if (!profileIDs.length) return false

      return {
        hostProfiles: {
          in: profileIDs,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['title', 'startsAt', 'visibility', '_status', 'updatedAt'],
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
      name: 'sessionType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'brownbag',
      options: [
        {
          label: 'Brownbag',
          value: 'brownbag',
        },
        {
          label: 'Workshop',
          value: 'workshop',
        },
        {
          label: 'All hands',
          value: 'all-hands',
        },
        {
          label: 'Demo',
          value: 'demo',
        },
        {
          label: 'Pitch',
          value: 'pitch',
        },
        {
          label: 'Fireside',
          value: 'fireside',
        },
      ],
      required: true,
    },
    {
      name: 'speaker',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'hostProfiles',
      type: 'relationship',
      admin: {
        description: 'Optional hosts or facilitators for interview-style sessions.',
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'speakerProfiles',
      type: 'relationship',
      admin: {
        description: 'Optional guests or speakers. Prefer this for multi-speaker sessions.',
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'profiles',
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
      required: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'locationLabel',
      type: 'text',
    },
    {
      name: 'joinURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'calendarURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'discordEventURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'discordScheduledEventID',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'discordSyncStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 'not_configured',
      options: [
        {
          label: 'Not configured',
          value: 'not_configured',
        },
        {
          label: 'Synced',
          value: 'synced',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
    },
    {
      name: 'discordSyncError',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'recordingURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'transcriptArtifactURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'summaryArtifactURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'sourceArtifactURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'sourceArtifactID',
      type: 'text',
      admin: {
        description: 'Prism artifact ID for the primary transcript, summary, or source bundle.',
      },
    },
    {
      name: 'sourceStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'scheduled',
      options: [
        {
          label: 'Scheduled',
          value: 'scheduled',
        },
        {
          label: 'Recorded',
          value: 'recorded',
        },
        {
          label: 'Summarized',
          value: 'summarized',
        },
        {
          label: 'Processed',
          value: 'processed',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
    },
    {
      name: 'seriesKey',
      type: 'text',
      admin: {
        description:
          'Stable key for lightweight recurring-session grouping, e.g. weekly-all-hands.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'seriesTitle',
      type: 'text',
      admin: {
        description: 'Display title for the recurring session group.',
        position: 'sidebar',
      },
    },
    {
      name: 'recurrenceCadence',
      type: 'select',
      admin: {
        description: 'Copied forward by agents/jobs when generating the next occurrence.',
        position: 'sidebar',
      },
      options: [
        {
          label: 'Weekly',
          value: 'weekly',
        },
        {
          label: 'Every other week',
          value: 'biweekly',
        },
        {
          label: 'Monthly',
          value: 'monthly',
        },
      ],
    },
    {
      name: 'recurrenceUntil',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Optional end date for recurrence generation.',
        position: 'sidebar',
      },
    },
    {
      name: 'previousOccurrence',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ id }) => ({
        id: {
          not_in: [id],
        },
      }),
      relationTo: 'events',
    },
    {
      name: 'nextOccurrence',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ id }) => ({
        id: {
          not_in: [id],
        },
      }),
      relationTo: 'events',
    },
    {
      name: 'roleFocus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Designer',
          value: 'designer',
        },
        {
          label: 'PM',
          value: 'pm',
        },
        {
          label: 'DevOps',
          value: 'devops',
        },
        {
          label: 'Founder',
          value: 'founder',
        },
        {
          label: 'Developer',
          value: 'developer',
        },
        {
          label: 'Operations',
          value: 'operations',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    {
      name: 'practiceArea',
      type: 'text',
    },
    {
      name: 'themes',
      type: 'array',
      fields: [
        {
          name: 'theme',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'wikiCandidate',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'wikiCandidateTopics',
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
      name: 'linkedSocialPosts',
      type: 'array',
      fields: [
        {
          name: 'platform',
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
          name: 'label',
          type: 'text',
        },
        {
          name: 'publishedAt',
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
      name: 'resources',
      type: 'array',
      admin: {
        description: 'Session-specific links such as notes, slides, docs, repos, or artifacts.',
      },
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
              label: 'Notes',
              value: 'notes',
            },
            {
              label: 'Slides',
              value: 'slides',
            },
            {
              label: 'Document',
              value: 'doc',
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
              label: 'Artifact',
              value: 'artifact',
            },
            {
              label: 'Other',
              value: 'other',
            },
          ],
        },
      ],
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
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'public',
      options: [
        {
          label: 'Authenticated',
          value: 'authenticated',
        },
        {
          label: 'Members',
          value: 'member',
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
    afterChange: [createEventPublishedNotifications, recordEventPublishedActivity],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
