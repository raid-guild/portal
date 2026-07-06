import type { CollectionConfig } from 'payload'

import { contentEditors } from '@/access/roles'

export const NewsletterCampaigns: CollectionConfig = {
  slug: 'newsletterCampaigns',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: contentEditors,
    update: contentEditors,
  },
  admin: {
    defaultColumns: ['title', 'status', 'post', 'listmonkCampaignID', 'lastSyncedAt', 'updatedAt'],
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
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'preheader',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'draft',
      index: true,
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Test sent',
          value: 'test_sent',
        },
        {
          label: 'Sent',
          value: 'sent',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
        {
          label: 'Error',
          value: 'error',
        },
      ],
      required: true,
    },
    {
      name: 'listmonkCampaignID',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'listmonkCampaignUUID',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'listmonkCampaignURL',
      type: 'text',
    },
    {
      name: 'templateID',
      type: 'number',
      required: true,
    },
    {
      name: 'listIDs',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'listID',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'fromEmail',
      type: 'text',
      required: true,
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'lastTestSentAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'lastTestEmail',
      type: 'email',
    },
    {
      name: 'lastError',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
    },
  ],
}
