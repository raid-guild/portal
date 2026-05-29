import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import type { ContributionRequest, User } from '@/payload-types'

import type { RequestRelationOption } from './ContributionRequestForm'

type CurrentUser = User

export const getContributionRequestFormData = async (user: CurrentUser) => {
  const [profiles, currentProfile, projects, events, threads, posts, skills, stewardedProjectIDs] =
    await Promise.all([
      getProfileOptions(user),
      getProfileForUser(user.id, user),
      getProjectOptions(user),
      getEventOptions(user),
      getThreadOptions(user),
      getPostOptions(user),
      getSkillOptions(user),
      getStewardedProjectIDsForUser(user),
    ])

  return {
    currentProfile,
    events,
    posts,
    profiles,
    projects,
    stewardedProjectIDs,
    skills,
    threads,
  }
}

export const getContributionRequestBySlugForForm = async ({
  slug,
  user,
}: {
  slug: string
  user: CurrentUser
}): Promise<ContributionRequest | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'contributionRequests',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0] || null
}

export const toRequestFormValue = (request: ContributionRequest) => ({
  body: request.body,
  id: request.id,
  owner: relationID(request.owner),
  profileSkills: relationIDs(request.profileSkills),
  project: relationID(request.project),
  relatedEvents: relationIDs(request.relatedEvents),
  relatedPosts: relationIDs(request.relatedPosts),
  relatedProfiles: relationIDs(request.relatedProfiles),
  relatedThreads: relationIDs(request.relatedThreads),
  requestStatus: request.requestStatus,
  requestType: request.requestType,
  responseURL: request.responseURL,
  slug: request.slug,
  summary: request.summary,
  title: request.title,
  visibility: request.visibility,
})

export const canManageContributionRequest = async (
  user: CurrentUser | null,
  request: ContributionRequest,
): Promise<boolean> => {
  if (!user) return false
  if (canContributeContent(user)) return true

  const [currentProfile, stewardedProjectIDs] = await Promise.all([
    getProfileForUser(user.id, user),
    getStewardedProjectIDsForUser(user),
  ])

  const projectID = relationID(request.project)

  if (projectID && stewardedProjectIDs.map(String).includes(String(projectID))) return true

  if (request._status === 'published') return false

  return Boolean(
    currentProfile?.id && String(relationID(request.owner)) === String(currentProfile.id),
  )
}

const getProfileOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 150,
    overrideAccess: false,
    pagination: false,
    select: {
      displayName: true,
      handle: true,
    },
    sort: 'displayName',
    user,
    where: {
      status: {
        equals: 'active',
      },
    },
  })

  return result.docs.map((profile) => ({
    href: profile.handle ? `/members/${profile.handle}` : undefined,
    id: profile.id,
    label: profile.displayName,
  }))
}

const getProfileForUser = async (userID: string | number, user: CurrentUser) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const getStewardedProjectIDsForUser = async (user: CurrentUser): Promise<(number | string)[]> => {
  const profile = await getProfileForUser(user.id, user)

  if (!profile) return []

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      stewards: {
        in: [profile.id],
      },
    },
  })

  return result.docs.map((project) => project.id)
}

const getProjectOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
      title: true,
    },
    sort: 'title',
    user,
  })

  return result.docs.map((project) => ({
    href: project.slug ? `/projects/${project.slug}` : undefined,
    id: project.id,
    label: project.title,
  }))
}

const getEventOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      startsAt: true,
      title: true,
    },
    sort: '-startsAt',
    user,
  })

  return result.docs.map((event) => ({
    href: `/events/${event.id}`,
    id: event.id,
    label: event.title,
  }))
}

const getThreadOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'threads',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
    },
    sort: 'title',
    user,
  })

  return result.docs.map((thread) => ({
    id: thread.id,
    label: thread.title,
  }))
}

const getPostOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
      title: true,
    },
    sort: '-publishedAt',
    user,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs.map((post) => ({
    href: post.slug ? `/posts/${post.slug}` : undefined,
    id: post.id,
    label: post.title,
  }))
}

const getSkillOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profileSkills',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
    },
    sort: 'title',
    user,
  })

  return result.docs.map((skill) => ({
    id: skill.id,
    label: skill.title,
  }))
}

const relationID = <T extends { id: number }>(item?: number | T | null): number | string | null => {
  if (!item) return null

  return typeof item === 'object' ? item.id : item
}

const relationIDs = <T extends { id: number }>(
  items?: (number | T)[] | null,
): (number | string)[] => items?.map((item) => (typeof item === 'object' ? item.id : item)) || []
