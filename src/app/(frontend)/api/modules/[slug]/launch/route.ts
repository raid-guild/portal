import configPromise from '@payload-config'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getAddress, isAddress } from 'viem'

import type { Media, Module, Profile, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { toSafeURL } from '@/utilities/safeURL'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

type LaunchTokenPayload = {
  aud: string
  credentials?: LaunchCredential[]
  email?: string
  handle?: string
  iss: string
  moduleSlug: string
  name?: string
  picture?: string
  profileID?: number | string
  roles?: string[]
  scopes: string[]
  sub: string
  typ: 'portal_module_launch'
  userID: number | string
  wallets?: LaunchWallet[]
}

type LaunchCredential = 'cohort_grad' | 'member'

type LaunchWallet = {
  address: string
  chainId: 100
  verifiedAt: string
}

const DEFAULT_LAUNCH_TTL_SECONDS = 120
const MAX_LAUNCH_TTL_SECONDS = 600
const MIN_LAUNCH_TTL_SECONDS = 30

const getLaunchIssuer = (): string => getServerSideURL().replace(/\/+$/, '')

export async function GET(_request: Request, { params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to launch this module.' }, { status: 401 })
  }

  const portalModule = await getLaunchableModule(payload, slug, user)

  if (!portalModule) {
    return Response.json({ message: 'Module not found.' }, { status: 404 })
  }

  if (portalModule.moduleKind !== 'external' || portalModule.authMode !== 'signed_launch') {
    return Response.json(
      { message: 'This module is not configured for signed external launch.' },
      { status: 400 },
    )
  }

  if (!userHasRequiredRole(user, portalModule.launchRequiredRoles)) {
    return Response.json(
      { message: 'You do not have permission to launch this module.' },
      { status: 403 },
    )
  }

  if (portalModule.includeEmailInLaunch && !user.emailVerifiedAt) {
    return Response.json(
      { message: 'Verify your email before launching this module.' },
      { status: 403 },
    )
  }

  const callbackURL = toSafeURL(portalModule.externalCallbackURL, {
    allowRelative: false,
    protocols: ['https:'],
  })

  if (!callbackURL) {
    return Response.json({ message: 'Module callback URL is not configured.' }, { status: 500 })
  }

  const secretKey = portalModule.launchSecretEnvKey?.trim()
  const secret = secretKey ? process.env[secretKey] : ''

  if (!secret) {
    payload.logger.error({
      moduleSlug: portalModule.slug,
      msg: 'External module launch secret is missing.',
      secretKey,
    })

    return Response.json({ message: 'Module launch secret is not configured.' }, { status: 500 })
  }

  const profile = await getProfileForUser(payload, user.id)
  const credentials = await getLaunchCredentials(payload, profile, user)
  const token = signLaunchToken({
    credentials,
    portalModule,
    profile,
    secret,
    user,
  })
  const redirectURL = new URL(callbackURL)
  redirectURL.searchParams.set('token', token)

  payload.logger.info({
    moduleSlug: portalModule.slug,
    msg: 'External module launch token issued.',
    userID: user.id,
  })

  return Response.redirect(redirectURL, 302)
}

const getLaunchableModule = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  user: User,
): Promise<Module | null> => {
  if (!slug) return null

  const result = await payload.find({
    collection: 'modules',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
        {
          status: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}

const getProfileForUser = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  userID: number | string,
): Promise<Profile | null> => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const signLaunchToken = ({
  credentials,
  portalModule,
  profile,
  secret,
  user,
}: {
  credentials: LaunchCredential[]
  portalModule: Module
  profile: Profile | null
  secret: string
  user: User
}): string => {
  const issuer = getLaunchIssuer()
  const audience =
    portalModule.launchAudience?.trim() || portalModule.slug || String(portalModule.id)
  const ttlSeconds = normalizeTTL(portalModule.launchTokenTTLSeconds)
  const claims: LaunchTokenPayload = {
    aud: audience,
    iss: issuer,
    moduleSlug: portalModule.slug || String(portalModule.id),
    scopes: ['profile:read'],
    sub: `user:${user.id}`,
    typ: 'portal_module_launch',
    userID: user.id,
  }

  if (portalModule.includeEmailInLaunch && user.emailVerifiedAt && user.email) {
    claims.email = user.email
  }

  if (user.name) {
    claims.name = user.name
  }

  if (portalModule.includeRolesInLaunch && user.roles?.length) {
    claims.roles = user.roles.filter(Boolean)
  }

  if (credentials.length) {
    claims.credentials = credentials
  }

  if (profile) {
    const wallets = getVerifiedWallets(profile)
    if (wallets.length) claims.wallets = wallets
  }

  if (profile && portalModule.includeProfileInLaunch) {
    claims.profileID = profile.id
    claims.name = profile.displayName || claims.name

    if (portalModule.includeHandleInLaunch && profile.handle) {
      claims.handle = profile.handle
    }

    if (portalModule.includeAvatarInLaunch) {
      const avatarURL = getMediaURL(profile.avatar)
      if (avatarURL) claims.picture = avatarURL
    }
  }

  return jwt.sign(claims, secret, {
    algorithm: 'HS256',
    expiresIn: ttlSeconds,
    jwtid: crypto.randomUUID(),
  })
}

const getLaunchCredentials = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  profile: Profile | null,
  user: User,
): Promise<LaunchCredential[]> => {
  const credentials = new Set<LaunchCredential>()

  if (user.roles?.includes('member')) credentials.add('member')
  if (!profile) return Array.from(credentials)

  const cohortGradBadge = await payload.find({
    collection: 'badges',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: 'cohort-grad',
      },
    },
  })
  const badgeID = cohortGradBadge.docs[0]?.id

  if (!badgeID) return Array.from(credentials)

  const cohortGradAward = await payload.find({
    collection: 'profileBadges',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { badge: { equals: badgeID } },
        {
          profiles: {
            in: [profile.id],
          },
        },
      ],
    },
  })

  if (cohortGradAward.docs.length) credentials.add('cohort_grad')

  return Array.from(credentials).sort()
}

const getVerifiedWallets = (profile: Profile): LaunchWallet[] => {
  if (!profile.walletAddress || !profile.walletVerifiedAt || !isAddress(profile.walletAddress)) {
    return []
  }

  const verifiedAt = new Date(profile.walletVerifiedAt)

  if (!Number.isFinite(verifiedAt.getTime())) return []

  return [
    {
      address: getAddress(profile.walletAddress),
      chainId: 100,
      verifiedAt: verifiedAt.toISOString(),
    },
  ]
}

const getMediaURL = (media: number | Media | null | undefined): string | undefined => {
  if (!media || typeof media !== 'object' || !media.url) return undefined

  if (media.url.startsWith('/')) {
    return `${getLaunchIssuer()}${media.url}`
  }

  return toSafeURL(media.url, { allowRelative: false, protocols: ['http:', 'https:'] }) || undefined
}

const normalizeTTL = (value: number | null | undefined): number => {
  if (!value || !Number.isFinite(value)) return DEFAULT_LAUNCH_TTL_SECONDS

  return Math.min(MAX_LAUNCH_TTL_SECONDS, Math.max(MIN_LAUNCH_TTL_SECONDS, Math.floor(value)))
}

const userHasRequiredRole = (user: User, requiredRoles: Module['launchRequiredRoles']): boolean => {
  if (!requiredRoles?.length) return true

  return requiredRoles.some((role) => user.roles?.includes(role))
}
