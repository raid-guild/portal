import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import pg from 'pg'
import { APIError, type PayloadRequest } from 'payload'

const STORE_TIMEOUT_MS = 5_000
const TOKEN_LIFETIME_MS = 300_000
const REPLAY_RETENTION_SECONDS = 600

// This is deliberately independent of Payload's request transaction: rejecting a
// create must never roll back the attempt counter or release a used token.
type StoreClient = {
  query: (query: { text: string; values?: unknown[]; query_timeout: number }) => Promise<{
    rows: Array<{ attempts?: number; retry_after?: number; maximum?: number }>
    rowCount: number | null
  }>
  release: (destroy?: boolean) => void
}
type StorePool = { connect: () => Promise<StoreClient> }
type ProtectionConfig = {
  secret: string
  windowSeconds: number
  ipMax: number
  emailMax: number
  turnstileSecret: string
  hostnames: string[]
}

function unavailable(req: PayloadRequest): never {
  req.responseHeaders ??= new Headers()
  req.responseHeaders.set('Retry-After', '60')
  throw new APIError(
    'Inquiry protection is temporarily unavailable. Please try again shortly.',
    503,
    {
      code: 'inquiry-protection-unavailable',
      retryAfter: 60,
    },
    true,
  )
}

function configInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (value === undefined) return fallback
  if (!/^\d+$/.test(value)) throw new Error('Invalid inquiry protection configuration')
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw new Error('Invalid inquiry protection configuration')
  }
  return number
}

function protectionConfig(): ProtectionConfig {
  const secret = process.env.INQUIRY_RATE_LIMIT_SECRET || ''
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || ''
  const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  if (
    secret.length < 32 ||
    !turnstileSecret ||
    !hostnames.length ||
    (process.env.NODE_ENV === 'production' && /^[123]x0+AA$/.test(turnstileSecret)) ||
    hostnames.some((host) => !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host))
  ) {
    throw new Error('Missing or invalid inquiry protection configuration')
  }
  return {
    secret,
    turnstileSecret,
    hostnames,
    windowSeconds: configInteger(process.env.INQUIRY_RATE_LIMIT_WINDOW_SECONDS, 3600, 60, 86400),
    ipMax: configInteger(process.env.INQUIRY_RATE_LIMIT_IP_MAX, 10, 1, 10000),
    emailMax: configInteger(process.env.INQUIRY_RATE_LIMIT_EMAIL_MAX, 3, 1, 10000),
  }
}

/** Only enable a header that an origin-protecting proxy always overwrites. */
export function inquiryClientIP(
  headers: Headers,
  trustedHeader = process.env.INQUIRY_TRUSTED_IP_HEADER,
): string {
  if (!trustedHeader || !/^[a-z0-9-]+$/i.test(trustedHeader)) return 'unknown'
  const value = headers.get(trustedHeader)?.trim() || ''
  const version = isIP(value)
  if (!version || value.includes('%')) return 'unknown'
  if (version === 4) return value
  // Canonicalize equivalent IPv6 spellings to the same limit bucket.
  const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1)
  // Treat IPv4-mapped IPv6 addresses the same as their IPv4 counterpart.
  const mapped = canonical.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mapped) {
    const upper = parseInt(mapped[1], 16)
    const lower = parseInt(mapped[2], 16)
    return `${upper >> 8}.${upper & 255}.${lower >> 8}.${lower & 255}`
  }
  return canonical
}

export function inquiryPrivacyKey(
  secret: string,
  kind: 'ip' | 'email' | 'token',
  value: string,
): string {
  const normalized = kind === 'email' ? value.trim().toLowerCase() : value
  return createHmac('sha256', secret).update(`${kind}:${normalized}`).digest('hex')
}

// Payload opens request transactions before collection hooks. A separate bounded
// pool prevents those transactions from starving the protection reservations.
let protectionPool: pg.Pool | undefined
function inquiryStore(): StorePool {
  if (!protectionPool) {
    protectionPool = new pg.Pool({
      connectionString: process.env.DATABASE_URI,
      max: 3,
      connectionTimeoutMillis: STORE_TIMEOUT_MS,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    })
    // An idle-client error must not crash the server or expose connection data.
    protectionPool.on('error', () => {})
  }
  return protectionPool as unknown as StorePool
}

async function withStore<T>(
  req: PayloadRequest,
  operation: (client: StoreClient) => Promise<T>,
  suppliedPool?: StorePool | null,
): Promise<T> {
  const pool = suppliedPool === undefined ? inquiryStore() : suppliedPool
  if (!pool) return unavailable(req)
  let expired = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  let client: StoreClient | undefined
  let destroy = false
  try {
    // Release a connection that arrives after our deadline, avoiding leaked pool
    // clients when the pool is exhausted. No request transaction is reused.
    const connecting = pool.connect().then((connected) => {
      if (expired) {
        connected.release()
        throw new Error('Inquiry store deadline exceeded')
      }
      return connected
    })
    client = await Promise.race([
      connecting,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          expired = true
          reject(new Error('Inquiry store deadline exceeded'))
        }, STORE_TIMEOUT_MS)
      }),
    ])
    clearTimeout(timeout)
    return await operation(client)
  } catch (error) {
    if (error instanceof APIError) throw error
    destroy = true
    // Do not log tokens, addresses, emails, query parameters, or provider bodies.
    return unavailable(req)
  } finally {
    clearTimeout(timeout)
    client?.release(destroy)
  }
}

export async function consumeInquiryLimits(
  req: PayloadRequest,
  email: string,
  config: Pick<ProtectionConfig, 'secret' | 'windowSeconds' | 'ipMax' | 'emailMax'>,
  suppliedPool?: StorePool | null,
): Promise<void> {
  const ipKey = inquiryPrivacyKey(config.secret, 'ip', inquiryClientIP(req.headers))
  const emailKey = inquiryPrivacyKey(config.secret, 'email', email)
  await withStore(
    req,
    async (client) => {
      // Limit cleanup work per request. An operator can also run expiry deletes
      // periodically so idle deployments do not retain expired pseudonymous keys.
      await client.query({
        text: `DELETE FROM inquiry_rate_limits WHERE expires_at <= NOW() AND bucket_key IN
        (SELECT bucket_key FROM inquiry_rate_limits WHERE expires_at <= NOW() ORDER BY expires_at LIMIT 100)`,
        query_timeout: STORE_TIMEOUT_MS,
      })
      const result = await client.query({
        text: `INSERT INTO inquiry_rate_limits (bucket_key, attempts, expires_at)
        SELECT bucket_key, 1, NOW() + $3 * INTERVAL '1 second'
        FROM (VALUES ($1::text), ($2::text)) AS buckets(bucket_key) ORDER BY bucket_key
        ON CONFLICT (bucket_key) DO UPDATE SET
          attempts = CASE WHEN inquiry_rate_limits.expires_at <= NOW() THEN 1
            ELSE LEAST(inquiry_rate_limits.attempts + 1, $4::int) END,
          expires_at = CASE WHEN inquiry_rate_limits.expires_at <= NOW()
            THEN NOW() + $3 * INTERVAL '1 second' ELSE inquiry_rate_limits.expires_at END
        RETURNING attempts,
          CEIL(EXTRACT(EPOCH FROM (expires_at - NOW())))::int AS retry_after,
          CASE WHEN bucket_key = $1 THEN $5::int ELSE $6::int END AS maximum`,
        values: [
          ipKey,
          emailKey,
          config.windowSeconds,
          Math.max(config.ipMax, config.emailMax) + 1,
          config.ipMax,
          config.emailMax,
        ],
        query_timeout: STORE_TIMEOUT_MS,
      })
      const exceeded = result.rows.filter((row) => Number(row.attempts) > Number(row.maximum))
      if (exceeded.length) {
        const retryAfter = Math.max(1, ...exceeded.map((row) => Number(row.retry_after)))
        req.responseHeaders ??= new Headers()
        req.responseHeaders.set('Retry-After', String(retryAfter))
        throw new APIError(
          'Too many inquiry attempts. Please wait before trying again.',
          429,
          {
            code: 'inquiry-rate-limit',
            retryAfter,
          },
          true,
        )
      }
    },
    suppliedPool,
  )
}

type TurnstileResult = {
  success?: boolean
  hostname?: string
  action?: string
  challenge_ts?: string
  'error-codes'?: string[]
}

export function validInquiryChallenge(
  result: TurnstileResult,
  hostnames: string[],
  now = Date.now(),
): boolean {
  const timestamp = typeof result.challenge_ts === 'string' ? Date.parse(result.challenge_ts) : NaN
  return (
    result.success === true &&
    result.action === 'inquiry' &&
    typeof result.hostname === 'string' &&
    hostnames.includes(result.hostname.toLowerCase()) &&
    Number.isFinite(timestamp) &&
    timestamp <= now &&
    now - timestamp <= TOKEN_LIFETIME_MS
  )
}

/** Called by collection hooks for every untrusted create, including local API. */
export async function enforceInquiryAbuse(
  req: PayloadRequest,
  email: string,
  token: unknown,
  suppliedPool?: StorePool | null,
): Promise<void> {
  if (
    process.env.INQUIRY_PROTECTION_MODE === 'development' &&
    process.env.NODE_ENV !== 'production'
  )
    return
  if (process.env.INQUIRY_PROTECTION_MODE && process.env.INQUIRY_PROTECTION_MODE !== 'enforce')
    unavailable(req)
  let config: ProtectionConfig
  try {
    config = protectionConfig()
  } catch {
    return unavailable(req)
  }
  await consumeInquiryLimits(req, email, config, suppliedPool)
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    throw new APIError(
      'Complete the verification challenge and try again.',
      400,
      { code: 'inquiry-challenge-invalid' },
      true,
    )
  }
  // Cloudflare replay detection is eventually consistent. Atomically reserve the
  // hash locally before contacting Siteverify, including concurrent API calls.
  const reserved = await withStore(
    req,
    async (client) => {
      await client.query({
        text: `DELETE FROM inquiry_challenge_tokens WHERE expires_at <= NOW() AND token_hash IN
        (SELECT token_hash FROM inquiry_challenge_tokens WHERE expires_at <= NOW() ORDER BY expires_at LIMIT 100)`,
        query_timeout: STORE_TIMEOUT_MS,
      })
      return client.query({
        text: `INSERT INTO inquiry_challenge_tokens (token_hash, expires_at)
        VALUES ($1, NOW() + $2 * INTERVAL '1 second') ON CONFLICT DO NOTHING`,
        values: [inquiryPrivacyKey(config.secret, 'token', token), REPLAY_RETENTION_SECONDS],
        query_timeout: STORE_TIMEOUT_MS,
      })
    },
    suppliedPool,
  )
  if (!reserved.rowCount) {
    throw new APIError(
      'Verification expired or was already used. Please complete a new challenge.',
      400,
      { code: 'inquiry-challenge-invalid' },
      true,
    )
  }
  let result: TurnstileResult
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
    })
    if (!response.ok) return unavailable(req)
    result = (await response.json()) as TurnstileResult
    if (
      !result ||
      typeof result !== 'object' ||
      typeof result.success !== 'boolean' ||
      (result['error-codes'] !== undefined && !Array.isArray(result['error-codes']))
    )
      return unavailable(req)
  } catch {
    return unavailable(req)
  }
  if (
    result['error-codes']?.some((code) =>
      ['internal-error', 'missing-input-secret', 'invalid-input-secret'].includes(code),
    )
  ) {
    return unavailable(req)
  }
  if (!validInquiryChallenge(result, config.hostnames)) {
    throw new APIError(
      'Verification failed. Please complete a new challenge and try again.',
      400,
      { code: 'inquiry-challenge-invalid' },
      true,
    )
  }
}
