import type { Payload } from 'payload'

type CleanupSpamSignupsOptions = {
  deleteUsers?: boolean
  dryRun?: boolean
  pageURL?: string
  since?: string
}

type CleanupUserCandidate = {
  createdAt?: string | null
  email?: string | null
  id: number | string
}

type CleanupFeedbackCandidate = {
  adminNotes?: string | null
  createdAt?: string | null
  id: number | string
  submittedBy?: CleanupUserCandidate | number | string | null
}

const spamCleanupNote = 'Marked as spam by signup spam cleanup.'
const defaultSince = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

export const cleanupSpamSignups = async (
  payload: Payload,
  {
    deleteUsers = false,
    dryRun = true,
    pageURL = '/join',
    since = defaultSince(),
  }: CleanupSpamSignupsOptions = {},
) => {
  const feedbackCandidates = await payload.find({
    collection: 'feedbackSubmissions',
    depth: 1,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          pageURL: {
            equals: pageURL,
          },
        },
        {
          createdAt: {
            greater_than_equal: since,
          },
        },
        {
          status: {
            not_equals: 'spam',
          },
        },
      ],
    },
  })

  const userCandidates = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          createdAt: {
            greater_than_equal: since,
          },
        },
        {
          emailVerifiedAt: {
            exists: false,
          },
        },
        {
          roles: {
            contains: 'unverified',
          },
        },
      ],
    },
  })

  const feedbackUserIDs = new Set(
    (feedbackCandidates.docs as CleanupFeedbackCandidate[])
      .map((feedback) => getRelationID(feedback.submittedBy))
      .filter(Boolean),
  )

  const deletableUsers = (userCandidates.docs as CleanupUserCandidate[]).filter((user) =>
    feedbackUserIDs.has(String(user.id)),
  )

  const result = {
    deleteUsers,
    dryRun,
    feedbackMarkedSpam: 0,
    feedbackToMarkSpam: feedbackCandidates.docs.length,
    pageURL,
    since,
    usersDeleted: 0,
    usersToDelete: deleteUsers ? deletableUsers.length : 0,
  }

  if (dryRun) return result

  for (const feedback of feedbackCandidates.docs as CleanupFeedbackCandidate[]) {
    await payload.update({
      collection: 'feedbackSubmissions',
      data: {
        adminNotes: appendAdminNote(feedback.adminNotes, spamCleanupNote),
        status: 'spam',
      },
      id: feedback.id,
      overrideAccess: true,
    })
    result.feedbackMarkedSpam += 1
  }

  if (deleteUsers) {
    for (const user of deletableUsers) {
      await payload.delete({
        collection: 'users',
        id: user.id,
        overrideAccess: true,
      })
      result.usersDeleted += 1
    }
  }

  return result
}

const getRelationID = (relation: CleanupUserCandidate | number | string | null | undefined) => {
  if (!relation) return ''
  if (typeof relation === 'number' || typeof relation === 'string') return String(relation)

  return String(relation.id)
}

const appendAdminNote = (existingNote: string | null | undefined, note: string) => {
  const normalized = existingNote?.trim()

  if (!normalized) return note
  if (normalized.includes(note)) return normalized

  return `${normalized}\n\n${note}`
}
