import type { CollectionConfig } from 'payload'

import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'
import {
  finalizeInquiryIntake,
  inquiryProtectionFields,
  protectInquiryOperation,
} from '@/utilities/inquiryIntake'

export const SponsorInquiries: CollectionConfig = {
  slug: 'sponsorInquiries',
  access: {
    create: () => true,
    delete: ({ req: { user } }) => canEditContent(user),
    read: ({ req: { user } }) => canEditContent(user),
    update: ({ req: { user } }) => canEditContent(user),
  },
  admin: {
    defaultColumns: ['name', 'organization', 'sponsorType', 'status', 'createdAt'],
    description: 'Private intake records for sponsor, bounty, project, and funding opportunities.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'organization',
  },
  fields: [
    ...inquiryProtectionFields,
    {
      name: 'name',
      type: 'text',
      maxLength: 120,
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'organization',
      type: 'text',
      maxLength: 200,
      required: true,
    },
    {
      name: 'sponsorType',
      type: 'select',
      defaultValue: 'project-opportunity',
      options: [
        {
          label: 'Project opportunity',
          value: 'project-opportunity',
        },
        {
          label: 'Bounty / paid work',
          value: 'bounty-paid-work',
        },
        {
          label: 'Grant / funding',
          value: 'grant-funding',
        },
        {
          label: 'Mentorship / office hours',
          value: 'mentorship-office-hours',
        },
        {
          label: 'Tooling / infrastructure',
          value: 'tooling-infrastructure',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      required: true,
    },
    {
      name: 'opportunity',
      type: 'textarea',
      admin: {
        description: 'What the sponsor is bringing to the cohort.',
      },
      maxLength: 3000,
      required: true,
    },
    {
      name: 'contributorNeeds',
      type: 'textarea',
      admin: {
        description: 'Roles, skills, or kinds of collaborators requested.',
      },
      maxLength: 1200,
    },
    {
      name: 'budgetRange',
      type: 'select',
      defaultValue: 'unknown',
      options: [
        {
          label: 'No budget yet',
          value: 'no-budget-yet',
        },
        {
          label: 'Under $1k',
          value: 'under-1k',
        },
        {
          label: '$1k-$5k',
          value: '1k-5k',
        },
        {
          label: '$5k-$15k',
          value: '5k-15k',
        },
        {
          label: '$15k+',
          value: '15k-plus',
        },
        {
          label: 'Unknown',
          value: 'unknown',
        },
      ],
    },
    {
      name: 'timeline',
      type: 'select',
      defaultValue: 'flexible',
      options: [
        {
          label: 'This week',
          value: 'this-week',
        },
        {
          label: 'This month',
          value: 'this-month',
        },
        {
          label: 'Next cohort cycle',
          value: 'next-cohort-cycle',
        },
        {
          label: 'Flexible',
          value: 'flexible',
        },
      ],
    },
    {
      name: 'links',
      type: 'array',
      maxRows: 5,
      fields: [
        {
          name: 'label',
          type: 'text',
          maxLength: 120,
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          maxLength: 2048,
          required: true,
          validate: (value) =>
            validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
        },
      ],
    },
    {
      name: 'preferredNextStep',
      type: 'select',
      defaultValue: 'talk-to-someone',
      options: [
        {
          label: 'Talk to someone',
          value: 'talk-to-someone',
        },
        {
          label: 'Submit for review',
          value: 'submit-for-review',
        },
        {
          label: 'Join a session',
          value: 'join-a-session',
        },
      ],
    },
    {
      name: 'canShowPublicly',
      type: 'checkbox',
      admin: {
        description: 'Whether this opportunity can be mentioned publicly after review.',
      },
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'Reviewing',
          value: 'reviewing',
        },
        {
          label: 'Accepted',
          value: 'accepted',
        },
        {
          label: 'Declined',
          value: 'declined',
        },
        {
          label: 'Converted',
          value: 'converted',
        },
      ],
      // Optional GraphQL input: this protected value is supplied by the server.
      validate: (value) =>
        typeof value === 'string' &&
        ['new', 'reviewing', 'accepted', 'declined', 'converted'].includes(value)
          ? true
          : 'Select a valid status.',
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        read: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeOperation: [protectInquiryOperation],
    beforeValidate: [finalizeInquiryIntake],
  },
  timestamps: true,
}
