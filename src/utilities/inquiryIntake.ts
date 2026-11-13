import {
  APIError,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type Field,
} from 'payload'

import { canEditContent } from '@/access/roles'
import { enforceInquiryAbuse } from '@/utilities/inquiryAbuse'
import { toSafeURL } from '@/utilities/safeURL'

// Symbols cannot be supplied through REST/GraphQL JSON or string context flags.
const trustedLink = Symbol('inquiry-account-link')
export const inquiryAccountLinkContext = (userID: number | string) => ({ [trustedLink]: userID })

const textLimits: Record<string, number> = {
  name: 120,
  email: 254,
  organization: 200,
  roleOrTitle: 200,
  message: 4000,
  opportunity: 3000,
  contributorNeeds: 1200,
  sourceRoute: 256,
  utmSource: 200,
  utmMedium: 200,
  utmCampaign: 200,
  turnstileToken: 2048,
  website: 200,
}
const common = [
  'name',
  'email',
  'organization',
  'budgetRange',
  'timeline',
  'links',
  'turnstileToken',
  'website',
]
const publicFields = {
  inquiries: [
    ...common,
    'type',
    'roleOrTitle',
    'message',
    'sourceRoute',
    'utmSource',
    'utmMedium',
    'utmCampaign',
    'relatedProject',
  ],
  sponsorInquiries: [
    ...common,
    'sponsorType',
    'opportunity',
    'contributorNeeds',
    'preferredNextStep',
    'canShowPublicly',
  ],
}
const internalFields = [
  'status',
  'notes',
  'reviewNotes',
  'accountLinkStatus',
  'submitterUser',
  'submitterProfile',
  'intakeReviewReason',
]
const enums = {
  inquiries: {
    type: ['client', 'sponsor', 'grant', 'opportunity', 'general'],
    budgetRange: ['no-budget-yet', 'under-5k', '5k-15k', '15k-50k', '50k-plus', 'unknown'],
    timeline: ['this-week', 'this-month', 'this-quarter', 'flexible'],
  },
  sponsorInquiries: {
    sponsorType: [
      'project-opportunity',
      'bounty-paid-work',
      'grant-funding',
      'mentorship-office-hours',
      'tooling-infrastructure',
      'other',
    ],
    budgetRange: ['no-budget-yet', 'under-1k', '1k-5k', '5k-15k', '15k-plus', 'unknown'],
    timeline: ['this-week', 'this-month', 'next-cohort-cycle', 'flexible'],
    preferredNextStep: ['talk-to-someone', 'submit-for-review', 'join-a-session'],
  },
}
type IntakeCollection = keyof typeof publicFields
const invalid = (field: string): never => {
  throw new APIError(`Invalid inquiry field: ${field}.`, 400)
}

/** Run before Payload coerces types, adds defaults or removes protected fields. */
export function normalizeInquiryInput(
  input: unknown,
  collection: IntakeCollection,
  editor = false,
) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('body')
  const data = { ...(input as Record<string, unknown>) }
  const allowed = new Set([...publicFields[collection], ...(editor ? internalFields : [])])
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) invalid('body')
    if (typeof value === 'string' && value.includes('\0')) invalid(key)
    if (key in textLimits) {
      if (value == null && !['name', 'email', 'message', 'opportunity'].includes(key)) {
        delete data[key]
        continue
      }
      if (typeof value !== 'string' || value.length > textLimits[key]) invalid(key)
      data[key] = (value as string).trim()
    }
  }
  for (const key of [
    'name',
    'email',
    collection === 'inquiries' ? 'message' : 'opportunity',
    ...(collection === 'sponsorInquiries' ? ['organization'] : []),
  ]) {
    if (typeof data[key] !== 'string' || !data[key]) invalid(key)
  }
  data.email = (data.email as string).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string)) invalid('email')
  for (const [key, options] of Object.entries(enums[collection])) {
    if (key === 'type' && !data[key]) invalid(key)
    if (
      data[key] != null &&
      (typeof data[key] !== 'string' || !options.includes(data[key] as never))
    )
      invalid(key)
  }
  if (data.canShowPublicly != null && typeof data.canShowPublicly !== 'boolean')
    invalid('canShowPublicly')
  if (
    data.relatedProject != null &&
    (!Number.isSafeInteger(data.relatedProject) || Number(data.relatedProject) <= 0)
  )
    invalid('relatedProject')
  if (data.links != null) {
    if (!Array.isArray(data.links) || data.links.length > 5) invalid('links')
    data.links = (data.links as unknown[]).map((link) => {
      if (!link || typeof link !== 'object' || Array.isArray(link)) invalid('links')
      const row = link as Record<string, unknown>
      if (Object.keys(row).some((key) => !['label', 'url'].includes(key))) invalid('links')
      if (
        typeof row.label !== 'string' ||
        !row.label.trim() ||
        row.label.length > 120 ||
        row.label.includes('\0')
      )
        invalid('links.label')
      if (typeof row.url !== 'string' || row.url.length > 2048 || row.url.includes('\0'))
        invalid('links.url')
      const url = toSafeURL(row.url as string, {
        allowRelative: false,
        protocols: ['http:', 'https:'],
      })
      if (!url || new URL(url).username || new URL(url).password) invalid('links.url')
      return { label: (row.label as string).trim(), url }
    })
  }
  return data
}

export const protectInquiryOperation: CollectionBeforeOperationHook = async ({
  args,
  collection,
  operation,
  req,
}) => {
  if (operation === 'update') {
    const linkUser = req.context?.[trustedLink as unknown as string]
    const update = 'data' in args ? (args.data as Record<string, unknown>) : undefined
    if (
      linkUser &&
      req.payloadAPI === 'local' &&
      'data' in args &&
      args.data &&
      Object.keys(args.data).every((key) => ['accountLinkStatus', 'submitterUser'].includes(key)) &&
      update?.accountLinkStatus === 'linked' &&
      update?.submitterUser === linkUser
    )
      return args
    if (!canEditContent(req.user)) throw new APIError('Inquiry updates require an editor.', 403)
    return args
  }
  if (operation !== 'create' || !('data' in args)) return args
  const editor = canEditContent(req.user)
  const data = normalizeInquiryInput(args.data, collection.slug as IntakeCollection, editor)
  if (data.relatedProject != null) {
    // Resolve through the public access policy, not an override or privileged session.
    const project = await req.payload.find({
      collection: 'projects',
      overrideAccess: false,
      user: null,
      where: { id: { equals: data.relatedProject } },
      limit: 1,
      depth: 0,
    })
    if (!project.docs.length) invalid('relatedProject')
  }
  if (!editor) await enforceInquiryAbuse(req, data.email as string, data.turnstileToken)
  args.data = data
  return args
}

export const finalizeInquiryIntake: CollectionBeforeValidateHook = ({
  data,
  collection,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data) return data
  // This runs after field access removes user-supplied protected fields.
  if (!canEditContent(req.user)) {
    data.status = 'reviewing'
    data.intakeReviewReason = data.website ? 'honeypot' : 'pending-review'
    if (collection.slug === 'inquiries') {
      data.accountLinkStatus = req.user?.id ? 'linked' : 'unlinked'
      data.submitterUser = req.user?.id ?? null
      data.submitterProfile = null
      delete data.notes
    } else delete data.reviewNotes
  }
  delete data.turnstileToken
  delete data.website
  return data
}

export const inquiryProtectionFields: Field[] = [
  {
    name: 'turnstileToken',
    type: 'text',
    virtual: true,
    maxLength: 2048,
    admin: { hidden: true },
    access: { read: () => false },
  },
  {
    name: 'website',
    type: 'text',
    virtual: true,
    maxLength: 200,
    admin: { hidden: true },
    access: { read: () => false },
  },
  {
    name: 'intakeReviewReason',
    type: 'text',
    maxLength: 40,
    admin: {
      position: 'sidebar',
      readOnly: true,
      description:
        'New public intake is held for manual review. Consent does not publish an inquiry.',
    },
    access: {
      create: () => false,
      update: () => false,
      read: ({ req }) => canEditContent(req.user),
    },
  },
]
