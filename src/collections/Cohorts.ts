import type { CollectionConfig } from 'payload'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentEditors } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'
import { validateYouTubeURL } from '@/utilities/videoEmbed'

export const Cohorts: CollectionConfig = {
  slug: 'cohorts',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: readVisiblePortalContent,
    update: contentEditors,
  },
  admin: {
    defaultColumns: [
      'title',
      'cohortNumber',
      'programStatus',
      'enrollmentStatus',
      'startsAt',
      'visibility',
      '_status',
    ],
    group: 'Modules',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField('title', {
      slugOverrides: {
        required: true,
        unique: true,
      },
    }),
    {
      name: 'cohortNumber',
      type: 'number',
      admin: { position: 'sidebar' },
      index: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'theme',
      type: 'text',
      required: true,
    },
    {
      name: 'thesis',
      type: 'textarea',
    },
    {
      name: 'programStatus',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: 'upcoming',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Gathering interest', value: 'gathering-interest' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Active', value: 'active' },
        { label: 'Complete', value: 'complete' },
        { label: 'Archived', value: 'archived' },
      ],
      required: true,
    },
    {
      name: 'enrollmentStatus',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: 'closed',
      index: true,
      options: [
        { label: 'Closed', value: 'closed' },
        { label: 'Open', value: 'open' },
        { label: 'Waitlist', value: 'waitlist' },
      ],
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' }, position: 'sidebar' },
      index: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' }, position: 'sidebar' },
    },
    {
      name: 'enrollmentOpensAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' }, position: 'sidebar' },
    },
    {
      name: 'enrollmentClosesAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' }, position: 'sidebar' },
    },
    {
      name: 'participationExpectation',
      type: 'textarea',
    },
    {
      name: 'capacity',
      type: 'number',
      admin: { position: 'sidebar' },
      min: 1,
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'explorationVideoURL',
      type: 'text',
      admin: {
        description: 'Optional YouTube video shown in What we are exploring.',
      },
      validate: validateYouTubeURL,
    },
    {
      name: 'visualVariant',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: 'guild',
      options: [
        { label: 'Guild', value: 'guild' },
        { label: 'Scroll', value: 'scroll' },
        { label: 'Moloch', value: 'moloch' },
      ],
      required: true,
    },
    {
      name: 'starterTopics',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'textarea' },
        {
          name: 'url',
          type: 'text',
          validate: (value) => validateSafeURL(value),
        },
      ],
    },
    {
      name: 'programSections',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
    {
      name: 'contextLinks',
      type: 'array',
      admin: {
        description: 'External references shown with related Portal context and work.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'textarea' },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value) => validateSafeURL(value, { allowRelative: false }),
        },
      ],
    },
    {
      name: 'highlightedThread',
      type: 'relationship',
      relationTo: 'threads',
    },
    {
      name: 'featuredPosts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
    },
    {
      name: 'featuredProjects',
      type: 'relationship',
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'featuredModules',
      type: 'relationship',
      hasMany: true,
      relationTo: 'modules',
    },
    {
      name: 'visibility',
      type: 'select',
      admin: { position: 'sidebar' },
      defaultValue: 'public',
      index: true,
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Authenticated', value: 'authenticated' },
        { label: 'Members', value: 'member' },
        { label: 'Admin', value: 'admin' },
      ],
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar' },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) =>
            siblingData._status === 'published' && !value ? new Date() : value,
        ],
      },
    },
  ],
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 25,
  },
}
