import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import {
  createCohortCommitment,
  readOwnCohortCommitments,
  updateOwnCohortCommitments,
} from '@/access/cohortCommitments'
import { getProfileIDsForUser, getRelationshipID } from '@/access/projectStewards'
import { contentEditors, canEditContent } from '@/access/roles'
import { isCohortEnrollmentOpen } from '@/cohorts/selectFeaturedCohort'

const prepareCommitment: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data
  if (!req.user?.id) throw new Error('Log in before committing to a cohort.')

  const canManage = canEditContent(req.user)

  if (operation === 'update' && canManage) return data

  const suppliedProfileID = canManage ? getRelationshipID(data.profile) : null
  const profileIDs = suppliedProfileID ? [suppliedProfileID] : await getProfileIDsForUser(req)
  const profileID = profileIDs[0]
  if (!profileID) throw new Error('Create a Portal profile before committing to a cohort.')

  if (operation === 'update') {
    const nextStatus = data.status || originalDoc?.status
    if (nextStatus !== 'committed' && nextStatus !== 'withdrawn') {
      throw new Error('You may commit to or withdraw from a cohort.')
    }

    if (nextStatus === 'committed' && originalDoc?.status !== 'committed') {
      const cohortID = getRelationshipID(originalDoc.cohort)
      if (!cohortID) throw new Error('This commitment is not connected to a cohort.')
      await assertEnrollmentOpen(req, cohortID)
    }

    return {
      ...data,
      cohort: originalDoc?.cohort,
      committedAt: originalDoc?.committedAt,
      expectationsAcknowledgedAt: originalDoc?.expectationsAcknowledgedAt,
      profile: originalDoc?.profile,
      withdrawnAt: originalDoc?.withdrawnAt,
    }
  }

  const cohortID = getRelationshipID(data.cohort)
  if (!cohortID) throw new Error('Choose a cohort.')

  if (!canManage) await assertEnrollmentOpen(req, cohortID)

  const existing = await req.payload.find({
    collection: 'cohortCommitments',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ cohort: { equals: cohortID } }, { profile: { equals: profileID } }],
    },
  })

  if (existing.docs.length) {
    throw new Error('Your profile already has a commitment for this cohort.')
  }

  const nowISO = new Date().toISOString()
  return {
    ...data,
    committedAt: data.committedAt || nowISO,
    expectationsAcknowledgedAt: data.expectationsAcknowledgedAt || nowISO,
    profile: canManage ? data.profile || profileID : profileID,
    status: canManage ? data.status || 'committed' : 'committed',
  }
}

export const CohortCommitments: CollectionConfig = {
  slug: 'cohortCommitments',
  access: {
    create: createCohortCommitment,
    delete: contentEditors,
    read: readOwnCohortCommitments,
    update: updateOwnCohortCommitments,
  },
  admin: {
    defaultColumns: ['cohort', 'profile', 'status', 'committedAt', 'updatedAt'],
    group: 'Modules',
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'cohort',
      type: 'relationship',
      relationTo: 'cohorts',
      required: true,
    },
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'committed',
      index: true,
      options: [
        { label: 'Committed', value: 'committed' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      required: true,
    },
    {
      name: 'shortResponse',
      type: 'textarea',
      maxLength: 500,
    },
    { name: 'expectationsAcknowledgedAt', type: 'date' },
    { name: 'committedAt', type: 'date' },
    { name: 'withdrawnAt', type: 'date' },
  ],
  hooks: {
    beforeValidate: [prepareCommitment],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data.status === 'withdrawn' && originalDoc?.status !== 'withdrawn') {
          return { ...data, withdrawnAt: data.withdrawnAt || new Date().toISOString() }
        }

        if (data.status === 'committed' && originalDoc?.status !== 'committed') {
          return {
            ...data,
            committedAt: data.committedAt || new Date().toISOString(),
            withdrawnAt: null,
          }
        }

        return data
      },
    ],
  },
  indexes: [
    {
      fields: ['cohort', 'profile'],
      unique: true,
    },
  ],
  timestamps: true,
}

const assertEnrollmentOpen = async (
  req: Parameters<CollectionBeforeValidateHook>[0]['req'],
  cohortID: number | string,
) => {
  const cohort = await req.payload.findByID({
    id: cohortID,
    collection: 'cohorts',
    depth: 0,
    overrideAccess: false,
    user: req.user,
  })
  if (!isCohortEnrollmentOpen(cohort)) {
    throw new Error('Enrollment is not open for this cohort.')
  }
}
