import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Project, User } from '@/payload-types'

import type { ProjectManagementValue } from './ProjectManagementForm'
import type { RequestRelationOption } from '../requests/ContributionRequestForm'

type CurrentUser = User

export const getProjectManagementFormData = async (user: CurrentUser) => {
  const [profiles, projects, events, threads] = await Promise.all([
    getProfileOptions(user),
    getProjectOptions(user),
    getEventOptions(user),
    getThreadOptions(user),
  ])

  return {
    events,
    profiles,
    projects,
    threads,
  }
}

export const getProjectBySlugForManagement = async ({
  slug,
  user,
}: {
  slug: string
  user: CurrentUser
}): Promise<Project | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
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

export const getProfileIDForUser = async (
  userID: string | number,
  user: CurrentUser,
): Promise<number | string | null> => {
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

  return result.docs[0]?.id || null
}

export const isProjectStewardProfile = (
  project: Project,
  profileID: number | string | null,
): boolean => {
  if (!profileID) return false

  const stewardIDs = relationIDs(project.stewards)

  return stewardIDs.map(String).includes(String(profileID))
}

export const toProjectManagementValue = (project: Project): ProjectManagementValue => ({
  contributors: relationIDs(project.contributors),
  events: relationIDs(project.events),
  id: project.id,
  links: project.links || [],
  primaryCTA: project.primaryCTA,
  projectStatus: project.projectStatus,
  relatedProjects: relationIDs(project.relatedProjects),
  resources: project.resources || [],
  slug: project.slug,
  summary: project.summary,
  threads: relationIDs(project.threads),
  title: project.title,
  visibility: project.visibility,
})

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

const getProjectOptions = async (user: CurrentUser): Promise<RequestRelationOption[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 150,
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
    limit: 150,
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
    limit: 150,
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

const relationIDs = <T extends { id: number }>(
  items?: (number | T)[] | null,
): (number | string)[] => items?.map((item) => (typeof item === 'object' ? item.id : item)) || []
