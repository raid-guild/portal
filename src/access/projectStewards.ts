import type { Access, PayloadRequest, Where } from 'payload'

import { canContributeContent, canEditContent, hasRole } from './roles'

type RelationshipValue = { id?: number | string } | number | string | null | undefined

export const updateProjectsAsContributorOrSteward: Access = async ({ req }) => {
  if (canContributeContent(req.user)) return true

  const projectIDs = await getStewardedProjectIDs(req)

  if (!projectIDs.length) return false

  return {
    id: {
      in: projectIDs,
    },
  }
}

export const createProjectActivityItems: Access = async ({ data, req }) => {
  if (canContributeContent(req.user)) return true

  const projectIDs = await getStewardedProjectIDs(req)

  if (!projectIDs.length) return false

  const requestedProjectID = getRelationshipID(data?.relatedProject)

  if (requestedProjectID) {
    return projectIDs.map(String).includes(String(requestedProjectID))
  }

  return false
}

export const manageProjectActivityItems: Access = async ({ req }) => {
  if (canContributeContent(req.user)) return true

  const projectIDs = await getStewardedProjectIDs(req)

  if (!projectIDs.length) return false

  return {
    relatedProject: {
      in: projectIDs,
    },
  }
}

export const manageProjectContributionRequests: Access = async ({ req }) => {
  if (canContributeContent(req.user)) return true

  const [profileIDs, projectIDs] = await Promise.all([
    getProfileIDsForUser(req),
    getStewardedProjectIDs(req),
  ])

  const or: Where[] = []

  if (profileIDs.length) {
    or.push({
      owner: {
        in: profileIDs,
      },
    })
  }

  if (projectIDs.length) {
    or.push(projectWhere(projectIDs))
  }

  if (!or.length) return false

  return {
    or,
  }
}

export const readContributionRequests: Access = async ({ req }) => {
  if (canEditContent(req.user)) return true

  const visibleWhere = getVisibleContributionRequestWhere(req.user)
  const profileIDs = await getProfileIDsForUser(req)

  if (!profileIDs.length) return visibleWhere

  return {
    or: [
      visibleWhere,
      {
        owner: {
          in: profileIDs,
        },
      },
    ],
  }
}

export const canPublishProjectContributionRequest = async ({
  projectID,
  req,
}: {
  projectID?: RelationshipValue
  req: PayloadRequest
}): Promise<boolean> => {
  if (canEditContent(req.user) || hasRole(req.user, 'agent')) return true

  const normalizedProjectID = getRelationshipID(projectID)

  if (!normalizedProjectID) return false

  return isProjectSteward(req, normalizedProjectID)
}

export const getStewardedProjectIDs = async (req: PayloadRequest): Promise<(number | string)[]> => {
  if (!req.user?.id) return []

  const profileIDs = await getProfileIDsForUser(req)

  if (!profileIDs.length) return []

  const projects = await req.payload.find({
    collection: 'projects',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      stewards: {
        in: profileIDs,
      },
    },
  })

  return projects.docs.map((project) => project.id)
}

export const isProjectSteward = async (
  req: PayloadRequest,
  projectID: number | string,
): Promise<boolean> => {
  const projectIDs = await getStewardedProjectIDs(req)

  return projectIDs.map(String).includes(String(projectID))
}

export const getRelationshipID = (value: RelationshipValue): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const id = value.id

    return typeof id === 'number' || typeof id === 'string' ? id : undefined
  }

  return undefined
}

export const getProfileIDsForUser = async (req: PayloadRequest): Promise<(number | string)[]> => {
  if (!req.user?.id) return []

  const profiles = await req.payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: req.user.id,
      },
    },
  })

  return profiles.docs.map((profile) => profile.id)
}

const projectWhere = (projectIDs: (number | string)[]): Where => ({
  project: {
    in: projectIDs,
  },
})

const publishedOnly: Where = {
  _status: {
    equals: 'published',
  },
}

const getVisibleContributionRequestWhere = (user: Parameters<typeof hasRole>[0]): Where => {
  if (hasRole(user, ['member', 'agent'])) {
    return {
      and: [
        publishedOnly,
        {
          visibility: {
            not_equals: 'admin',
          },
        },
      ],
    }
  }

  if (user) {
    return {
      and: [
        publishedOnly,
        {
          visibility: {
            in: ['public', 'authenticated'],
          },
        },
      ],
    }
  }

  return {
    and: [
      publishedOnly,
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }
}
