import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'

import { revalidatePath } from 'next/cache'

import { readPageCopy } from '@/access/pageCopy'
import { contentEditors, hideFromNonEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'
import { shouldSkipRevalidation } from '@/utilities/revalidation'

const pathForPageCopyKey = (key: string | null | undefined) => {
  if (!key) return null
  if (key === 'join') return '/join'
  if (key === 'brief-public') return '/'
  if (key.startsWith('inquire-')) return `/inquire/${key.replace('inquire-', '')}`

  return null
}

const revalidatePageCopyPath = ({
  doc,
  previousKey,
  req,
}: {
  doc: Record<string, unknown>
  previousKey?: string | null
  req: Parameters<CollectionAfterChangeHook>[0]['req']
}) => {
  if (shouldSkipRevalidation(req)) return doc

  const paths = new Set<string>()
  const currentPath = pathForPageCopyKey(typeof doc?.key === 'string' ? doc.key : null)
  const previousPath = pathForPageCopyKey(previousKey)

  if (currentPath) paths.add(currentPath)
  if (previousPath) paths.add(previousPath)

  paths.forEach((path) => {
    req.payload.logger.info(`Revalidating page copy path: ${path}`)
    revalidatePath(path)
  })

  return doc
}

const revalidatePageCopy: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  return revalidatePageCopyPath({
    doc,
    previousKey: typeof previousDoc?.key === 'string' ? previousDoc.key : null,
    req,
  })
}

const revalidateDeletedPageCopy: CollectionAfterDeleteHook = ({ doc, req }) => {
  return revalidatePageCopyPath({
    doc,
    req,
  })
}

export const PageCopy: CollectionConfig = {
  slug: 'pageCopy',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: readPageCopy,
    update: contentEditors,
  },
  admin: {
    defaultColumns: ['label', 'key', 'surface', 'status', 'updatedAt'],
    description: 'Structured copy overrides for fixed Portal product-flow pages.',
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'label',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'key',
      type: 'text',
      admin: {
        description: 'Stable route key, for example join or inquire-client.',
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'surface',
      type: 'select',
      defaultValue: 'other',
      index: true,
      options: [
        {
          label: 'Join',
          value: 'join',
        },
        {
          label: 'Inquiry',
          value: 'inquiry',
        },
        {
          label: 'Brief',
          value: 'brief',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'published',
      index: true,
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
            },
            {
              name: 'headline',
              type: 'text',
            },
            {
              name: 'intro',
              type: 'textarea',
            },
            {
              name: 'secondaryIntro',
              type: 'textarea',
            },
            {
              name: 'benefitsHeading',
              type: 'text',
            },
            {
              name: 'benefits',
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
              name: 'funnelEyebrow',
              type: 'text',
            },
            {
              name: 'funnelHeading',
              type: 'text',
            },
            {
              name: 'funnelLinks',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
                {
                  name: 'href',
                  type: 'text',
                  required: true,
                  validate: (value) => validateSafeURL(value, { allowRelative: true }),
                },
              ],
            },
          ],
          label: 'Display',
        },
        {
          fields: [
            {
              name: 'contextHeading',
              type: 'text',
            },
            {
              name: 'contextBody',
              type: 'textarea',
            },
            {
              name: 'messageLabel',
              type: 'text',
            },
            {
              name: 'submitLabel',
              type: 'text',
            },
            {
              name: 'postSubmitEyebrow',
              type: 'text',
            },
            {
              name: 'postSubmitHeading',
              type: 'text',
            },
            {
              name: 'postSubmitBody',
              type: 'textarea',
            },
            {
              name: 'createAccountLabel',
              type: 'text',
            },
            {
              name: 'submitAnotherLabel',
              type: 'text',
            },
            {
              name: 'backLinkLabel',
              type: 'text',
            },
          ],
          label: 'Flow',
        },
        {
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
            },
            {
              name: 'seoDescription',
              type: 'textarea',
            },
          ],
          label: 'SEO',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidatePageCopy],
    afterDelete: [revalidateDeletedPageCopy],
  },
  timestamps: true,
}
