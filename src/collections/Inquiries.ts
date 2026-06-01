import type { CollectionConfig } from 'payload'

import {
  createInquiries,
  deleteInquiries,
  readInquiries,
  updateInquiries,
} from '@/access/inquiries'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

export const inquiryTypeOptions = [
  {
    label: 'Client / build request',
    value: 'client',
  },
  {
    label: 'Sponsorship inquiry',
    value: 'sponsor',
  },
  {
    label: 'Grant or funding opportunity',
    value: 'grant',
  },
  {
    label: 'Partnership or collaboration',
    value: 'opportunity',
  },
  {
    label: 'General guild inquiry',
    value: 'general',
  },
] as const

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  access: {
    create: createInquiries,
    delete: deleteInquiries,
    read: readInquiries,
    update: updateInquiries,
  },
  admin: {
    defaultColumns: ['type', 'name', 'organization', 'status', 'accountLinkStatus', 'createdAt'],
    description:
      'Private intake records for onboarding, client, funding, and collaboration funnels.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      index: true,
      options: [...inquiryTypeOptions],
      required: true,
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
      index: true,
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
          label: 'Contacted',
          value: 'contacted',
        },
        {
          label: 'Converted',
          value: 'converted',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
        {
          label: 'Spam',
          value: 'spam',
        },
      ],
      required: true,
    },
    {
      name: 'accountLinkStatus',
      type: 'select',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'unlinked',
      index: true,
      options: [
        {
          label: 'Unlinked',
          value: 'unlinked',
        },
        {
          label: 'Linked',
          value: 'linked',
        },
        {
          label: 'Skipped',
          value: 'skipped',
        },
      ],
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      index: true,
      required: true,
    },
    {
      name: 'organization',
      type: 'text',
    },
    {
      name: 'roleOrTitle',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: 4000,
      required: true,
    },
    {
      name: 'budgetRange',
      type: 'select',
      options: [
        {
          label: 'No budget yet',
          value: 'no-budget-yet',
        },
        {
          label: 'Under $5k',
          value: 'under-5k',
        },
        {
          label: '$5k-$15k',
          value: '5k-15k',
        },
        {
          label: '$15k-$50k',
          value: '15k-50k',
        },
        {
          label: '$50k+',
          value: '50k-plus',
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
          label: 'This quarter',
          value: 'this-quarter',
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
      name: 'sourceRoute',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'utmSource',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'utmMedium',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'utmCampaign',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'submitterUser',
      type: 'relationship',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
    },
    {
      name: 'submitterProfile',
      type: 'relationship',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'relatedProject',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'notes',
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
    beforeValidate: [
      ({ data, req }) => {
        const user = req.user
        const normalizedData =
          typeof data?.email === 'string'
            ? {
                ...data,
                email: data.email.trim().toLowerCase(),
              }
            : data

        if (user?.id && !normalizedData?.submitterUser) {
          return {
            ...normalizedData,
            accountLinkStatus: 'linked',
            submitterUser: user.id,
          }
        }

        return normalizedData
      },
    ],
  },
  timestamps: true,
}
