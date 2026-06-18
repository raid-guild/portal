import type { CollectionConfig } from 'payload'

import { admins, hideFromNonEditors } from '@/access/roles'

export const SignupAttempts: CollectionConfig = {
  slug: 'signupAttempts',
  access: {
    create: admins,
    delete: admins,
    read: admins,
    update: admins,
  },
  admin: {
    defaultColumns: ['emailDomain', 'outcome', 'reason', 'createdAt'],
    description: 'Signup spam/rate-limit audit trail. Emails and IPs are stored as hashes.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    listSearchableFields: ['emailDomain', 'reason', 'userAgent'],
    useAsTitle: 'emailDomain',
  },
  fields: [
    {
      name: 'emailHash',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'emailDomain',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'ipHash',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'outcome',
      type: 'select',
      defaultValue: 'allowed',
      index: true,
      options: [
        {
          label: 'Allowed',
          value: 'allowed',
        },
        {
          label: 'Blocked',
          value: 'blocked',
        },
      ],
      required: true,
    },
    {
      name: 'reason',
      type: 'select',
      defaultValue: 'allowed',
      index: true,
      options: [
        {
          label: 'Allowed',
          value: 'allowed',
        },
        {
          label: 'Honeypot',
          value: 'honeypot',
        },
        {
          label: 'Too fast',
          value: 'too_fast',
        },
        {
          label: 'Missing proof',
          value: 'missing_proof',
        },
        {
          label: 'Rate limited',
          value: 'rate_limited',
        },
        {
          label: 'Blocked domain',
          value: 'blocked_domain',
        },
      ],
      required: true,
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
}
