import type { CollectionConfig } from 'payload'

import {
  createFeedbackSubmissions,
  deleteFeedbackSubmissions,
  readFeedbackSubmissions,
  updateFeedbackSubmissions,
} from '@/access/feedbackSubmissions'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

export const feedbackTypeOptions = [
  {
    label: 'Bug',
    value: 'bug',
  },
  {
    label: 'Feedback',
    value: 'feedback',
  },
  {
    label: 'Idea',
    value: 'idea',
  },
  {
    label: 'Content issue',
    value: 'content_issue',
  },
  {
    label: 'Account issue',
    value: 'account_issue',
  },
  {
    label: 'Other',
    value: 'other',
  },
] as const

export const FeedbackSubmissions: CollectionConfig = {
  slug: 'feedbackSubmissions',
  access: {
    create: createFeedbackSubmissions,
    delete: deleteFeedbackSubmissions,
    read: readFeedbackSubmissions,
    update: updateFeedbackSubmissions,
  },
  admin: {
    defaultColumns: ['type', 'title', 'status', 'priority', 'submittedBy', 'createdAt'],
    description: 'Private user feedback, bug reports, and product ideas for admin triage.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    listSearchableFields: ['title', 'message', 'email', 'pageURL'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'feedback',
      index: true,
      options: [...feedbackTypeOptions],
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
          label: 'Triaged',
          value: 'triaged',
        },
        {
          label: 'Planned',
          value: 'planned',
        },
        {
          label: 'Resolved',
          value: 'resolved',
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
      name: 'priority',
      type: 'select',
      access: {
        create: ({ req: { user } }) => canEditContent(user),
        update: ({ req: { user } }) => canEditContent(user),
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'normal',
      index: true,
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Normal',
          value: 'normal',
        },
        {
          label: 'High',
          value: 'high',
        },
        {
          label: 'Urgent',
          value: 'urgent',
        },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      maxLength: 160,
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: 4000,
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'submittedBy',
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
      name: 'submittedProfile',
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
      name: 'pageURL',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      validate: (value) => validateSafeURL(value, { allowRelative: true }),
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'viewport',
      type: 'json',
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'adminNotes',
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
      async ({ data, operation, req }) => {
        const user = req.user
        const normalizedData =
          typeof data?.email === 'string'
            ? {
                ...data,
                email: data.email.trim().toLowerCase(),
              }
            : data

        if (operation !== 'create' || !user?.id) return normalizedData

        const nextData: Record<string, unknown> = {
          ...normalizedData,
          email: normalizedData?.email || user.email,
          submittedBy: normalizedData?.submittedBy || user.id,
        }

        if (!nextData.submittedProfile) {
          const profiles = await req.payload.find({
            collection: 'profiles',
            depth: 0,
            limit: 1,
            overrideAccess: true,
            pagination: false,
            req,
            where: {
              user: {
                equals: user.id,
              },
            },
          })

          if (profiles.docs[0]?.id) {
            nextData.submittedProfile = profiles.docs[0].id
          }
        }

        return nextData
      },
    ],
  },
  timestamps: true,
}
