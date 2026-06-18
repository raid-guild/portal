import crypto from 'crypto'
import type { PayloadRequest } from 'payload'

type SignupProtectionData = {
  email?: unknown
  signupStartedAt?: unknown
  website?: unknown
}

type SignupBlockReason = 'blocked_domain' | 'honeypot' | 'missing_proof' | 'rate_limited' | 'too_fast'

const commonEmailDomains = new Set([
  'aol.com',
  'gmail.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'me.com',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.ca',
  'yahoo.com',
])

const blockedEmailDomains = new Set(
  (process.env.SIGNUP_BLOCKED_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
)

const minimumSignupMs = numberFromEnv('SIGNUP_MINIMUM_SUBMIT_MS', 3000)
const maxEmailAttemptsPerDay = numberFromEnv('SIGNUP_MAX_EMAIL_ATTEMPTS_PER_DAY', 3)
const maxIPAttemptsPerHour = numberFromEnv('SIGNUP_MAX_IP_ATTEMPTS_PER_HOUR', 6)
const maxIPAttemptsPerDay = numberFromEnv('SIGNUP_MAX_IP_ATTEMPTS_PER_DAY', 20)
const maxDomainAttemptsPerDay = numberFromEnv('SIGNUP_MAX_DOMAIN_ATTEMPTS_PER_DAY', 10)
const maxCommonDomainAttemptsPerDay = numberFromEnv('SIGNUP_MAX_COMMON_DOMAIN_ATTEMPTS_PER_DAY', 60)

export const enforceSignupProtection = async ({
  data,
  req,
}: {
  data: SignupProtectionData | undefined
  req: PayloadRequest
}) => {
  const email = normalizeEmail(data?.email)
  const emailDomain = getEmailDomain(email)
  const ipHash = hashValue(getClientIP(req))
  const emailHash = hashValue(email || 'missing-email')
  const userAgent = req.headers.get('user-agent') || ''
  const metadata = {
    hasStartedAt: Boolean(data?.signupStartedAt),
    source: 'users.beforeValidate',
  }

  const block = async (reason: SignupBlockReason, extraMetadata?: Record<string, unknown>) => {
    await recordSignupAttempt({
      emailDomain,
      emailHash,
      ipHash,
      metadata: {
        ...metadata,
        ...extraMetadata,
      },
      outcome: 'blocked',
      reason,
      req,
      userAgent,
    })

    throw new Error('Unable to create account right now. Try again later or contact an admin.')
  }

  if (!email || !emailDomain) {
    await block('missing_proof')
  }

  if (blockedEmailDomains.has(emailDomain)) {
    await block('blocked_domain')
  }

  if (typeof data?.website === 'string' && data.website.trim()) {
    await block('honeypot')
  }

  const startedAt = Number(data?.signupStartedAt)

  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    await block('missing_proof')
  }

  const elapsedMs = Date.now() - startedAt

  if (elapsedMs < minimumSignupMs) {
    await block('too_fast', { elapsedMs })
  }

  const [emailAttempts, ipHourAttempts, ipDayAttempts, domainAttempts] = await Promise.all([
    countSignupAttempts(req, {
      emailHash,
      since: hoursAgo(24),
    }),
    countSignupAttempts(req, {
      ipHash,
      since: hoursAgo(1),
    }),
    countSignupAttempts(req, {
      ipHash,
      since: hoursAgo(24),
    }),
    countSignupAttempts(req, {
      emailDomain,
      since: hoursAgo(24),
    }),
  ])

  const domainLimit = commonEmailDomains.has(emailDomain)
    ? maxCommonDomainAttemptsPerDay
    : maxDomainAttemptsPerDay

  if (
    emailAttempts >= maxEmailAttemptsPerDay ||
    ipHourAttempts >= maxIPAttemptsPerHour ||
    ipDayAttempts >= maxIPAttemptsPerDay ||
    domainAttempts >= domainLimit
  ) {
    await block('rate_limited', {
      domainAttempts,
      domainLimit,
      emailAttempts,
      ipDayAttempts,
      ipHourAttempts,
    })
  }

  await recordSignupAttempt({
    emailDomain,
    emailHash,
    ipHash,
    metadata: {
      ...metadata,
      elapsedMs,
    },
    outcome: 'allowed',
    reason: 'allowed',
    req,
    userAgent,
  })
}

const recordSignupAttempt = async ({
  emailDomain,
  emailHash,
  ipHash,
  metadata,
  outcome,
  reason,
  req,
  userAgent,
}: {
  emailDomain: string
  emailHash: string
  ipHash: string
  metadata?: Record<string, unknown>
  outcome: 'allowed' | 'blocked'
  reason:
    | 'allowed'
    | 'blocked_domain'
    | 'honeypot'
    | 'missing_proof'
    | 'rate_limited'
    | 'too_fast'
  req: PayloadRequest
  userAgent: string
}) => {
  try {
    await req.payload.create({
      collection: 'signupAttempts',
      data: {
        emailDomain,
        emailHash,
        ipHash,
        metadata,
        outcome,
        reason,
        userAgent: userAgent.slice(0, 500),
      },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: 'Failed to record signup attempt.',
    })
  }
}

const countSignupAttempts = async (
  req: PayloadRequest,
  {
    emailDomain,
    emailHash,
    ipHash,
    since,
  }: {
    emailDomain?: string
    emailHash?: string
    ipHash?: string
    since: Date
  },
) => {
  const constraints = [
    {
      createdAt: {
        greater_than_equal: since.toISOString(),
      },
    },
  ]

  if (emailHash) {
    constraints.push({
      emailHash: {
        equals: emailHash,
      },
    } as never)
  }

  if (emailDomain) {
    constraints.push({
      emailDomain: {
        equals: emailDomain,
      },
    } as never)
  }

  if (ipHash) {
    constraints.push({
      ipHash: {
        equals: ipHash,
      },
    } as never)
  }

  const result = await req.payload.count({
    collection: 'signupAttempts',
    overrideAccess: true,
    req,
    where: {
      and: constraints,
    },
  })

  return result.totalDocs
}

const getClientIP = (req: PayloadRequest) => {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIP = req.headers.get('x-real-ip')?.trim()
  const railwayIP = req.headers.get('x-railway-edge-ip')?.trim()

  return forwardedFor || realIP || railwayIP || 'unknown'
}

const getEmailDomain = (email: string) => email.split('@')[1]?.toLowerCase() || 'unknown'

const hashValue = (value: string) =>
  crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET || 'portal-signup-protection')
    .update(value)
    .digest('hex')

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000)

const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

function numberFromEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])

  return Number.isFinite(value) && value > 0 ? value : fallback
}
