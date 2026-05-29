import type { CollectionConfig, Payload } from 'payload'

import {
  createOwnDailyEngagement,
  deleteDailyEngagements,
  readOwnDailyEngagementsOrEditor,
  updateDailyEngagements,
} from '@/access/dailyEngagements'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import {
  DAILY_VIBE_CHECK_POINTS,
  dailyEngagementVibeEmojis,
  dailyEngagementVibeLabels,
  dailyEngagementVibes,
  normalizeEngagementDate,
} from '@/utilities/dailyEngagement'

export const DailyEngagements: CollectionConfig = {
  slug: 'dailyEngagements',
  access: {
    create: createOwnDailyEngagement,
    delete: deleteDailyEngagements,
    read: readOwnDailyEngagementsOrEditor,
    update: updateDailyEngagements,
  },
  admin: {
    defaultColumns: ['user', 'engagementDate', 'vibe', 'commentStatus', 'status', 'createdAt'],
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'engagementDate',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
      required: true,
    },
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'profiles',
    },
    {
      name: 'engagementDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Normalized UTC day for once-per-day check-ins.',
        position: 'sidebar',
      },
      index: true,
      required: true,
    },
    {
      name: 'vibe',
      type: 'select',
      options: dailyEngagementVibes.map((vibe) => ({
        label: `${dailyEngagementVibeEmojis[vibe]} ${dailyEngagementVibeLabels[vibe]}`,
        value: vibe,
      })),
      required: true,
    },
    {
      name: 'checkedIn',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: true,
      required: true,
    },
    {
      name: 'comment',
      type: 'textarea',
      admin: {
        description: 'Optional member note. Review status controls whether this can be displayed.',
      },
      maxLength: 1000,
    },
    {
      name: 'commentStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'none',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Pending Review',
          value: 'pending_review',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Hidden',
          value: 'hidden',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
      ],
      required: true,
    },
    {
      name: 'commentApprovedBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
    },
    {
      name: 'commentApprovedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'valid',
      options: [
        {
          label: 'Valid',
          value: 'valid',
        },
        {
          label: 'Void',
          value: 'void',
        },
      ],
      required: true,
    },
    {
      name: 'voidReason',
      type: 'textarea',
    },
    {
      name: 'pointEvent',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'pointEvents',
    },
  ],
  hooks: {
    afterChange: [
      async ({ context, doc, operation, req }) => {
        if (context.skipDailyEngagementPointAward) return doc
        if (operation !== 'create') return doc
        if (doc.status !== 'valid' || doc.pointEvent) return doc

        const pointEvent = await req.payload.create({
          collection: 'pointEvents',
          context: {
            skipDailyEngagementPointAward: true,
          },
          data: {
            amount: DAILY_VIBE_CHECK_POINTS,
            description: doc.comment || undefined,
            issuedAt: new Date().toISOString(),
            issuedBy: typeof doc.user === 'object' ? doc.user.id : doc.user,
            reason: 'Daily vibe check',
            recipient: typeof doc.user === 'object' ? doc.user.id : doc.user,
            relatedDailyEngagement: doc.id,
            source: 'system',
            status: 'valid',
          },
          overrideAccess: true,
          req,
        })

        await req.payload.update({
          id: doc.id,
          collection: 'dailyEngagements',
          context: {
            skipDailyEngagementPointAward: true,
          },
          data: {
            pointEvent: pointEvent.id,
          },
          overrideAccess: true,
          req,
        })

        return doc
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data

        const requesterCanEdit = canEditContent(req.user)
        const requestedUserID = getRelationshipID(data.user)
        const userID = requesterCanEdit ? requestedUserID || req.user?.id : req.user?.id

        if (!userID) {
          throw new Error('Daily engagement requires a user.')
        }

        const engagementDate = normalizeEngagementDate(
          data.engagementDate ? new Date(data.engagementDate) : new Date(),
        )

        const existing = await req.payload.find({
          collection: 'dailyEngagements',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              {
                user: {
                  equals: userID,
                },
              },
              {
                engagementDate: {
                  equals: engagementDate,
                },
              },
            ],
          },
        })

        if (existing.docs[0]) {
          throw new Error('You already checked in today.')
        }

        const profileID =
          requesterCanEdit && data.profile
            ? getRelationshipID(data.profile)
            : await getProfileIDForUser(req.payload, userID)

        if (!requesterCanEdit) {
          const safeData = {
            ...data,
            checkedIn: true,
            commentApprovedAt: undefined,
            commentApprovedBy: undefined,
            commentStatus: data.comment ? 'approved' : 'none',
            engagementDate,
            pointEvent: undefined,
            profile: profileID || undefined,
            status: 'valid',
            user: userID,
            voidReason: undefined,
          }

          return safeData
        }

        return {
          ...data,
          checkedIn: true,
          commentStatus: data.comment ? data.commentStatus || 'approved' : 'none',
          engagementDate,
          profile: profileID || undefined,
          status: data.status || 'valid',
          user: userID,
        }
      },
    ],
  },
  timestamps: true,
}

const getRelationshipID = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id

    return typeof id === 'number' || typeof id === 'string' ? id : undefined
  }

  return undefined
}

const getProfileIDForUser = async (
  payload: Payload,
  userID: number | string,
) => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0]?.id
}
