import assert from 'node:assert/strict'
import pg from 'pg'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import type { PayloadRequest } from 'payload'
import {
  consumeInquiryLimits as consumeLimits,
  enforceInquiryAbuse as enforceAbuse,
  inquiryClientIP,
  inquiryPrivacyKey,
  validInquiryChallenge,
} from '../src/utilities/inquiryAbuse'

// Dependency injection exists only in the server helper, never in API input.
const consumeInquiryLimits = (
  req: PayloadRequest,
  email: string,
  config: Parameters<typeof consumeLimits>[2],
) => consumeLimits(req, email, config, req.payload.db.pool ?? null)
const enforceInquiryAbuse = (req: PayloadRequest, email: string, token: unknown) =>
  enforceAbuse(req, email, token, req.payload.db.pool ?? null)

const secret = 'a-local-inquiry-test-secret-of-at-least-32-characters'
const config = { secret, windowSeconds: 60, ipMax: 10, emailMax: 3 }
const environment = {
  INQUIRY_PROTECTION_MODE: 'enforce',
  INQUIRY_RATE_LIMIT_SECRET: secret,
  INQUIRY_RATE_LIMIT_WINDOW_SECONDS: '60',
  INQUIRY_RATE_LIMIT_IP_MAX: '100',
  INQUIRY_RATE_LIMIT_EMAIL_MAX: '100',
  INQUIRY_TRUSTED_IP_HEADER: 'x-inquiry-test-ip',
  TURNSTILE_SECRET_KEY: 'test-provider-secret-not-a-cloudflare-test-key',
  TURNSTILE_ALLOWED_HOSTNAMES: 'portal.example',
}
const originalEnvironment = Object.fromEntries(
  Object.keys(environment)
    .concat('NODE_ENV')
    .map((key) => [key, process.env[key]]),
)
const originalFetch = globalThis.fetch
before(() => {
  Object.assign(process.env, environment)
})
after(() => {
  globalThis.fetch = originalFetch
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function request(pool?: unknown, ip = '192.0.2.1') {
  return {
    headers: new Headers({ 'x-inquiry-test-ip': ip }),
    payload: { db: { pool } },
  } as unknown as PayloadRequest
}
function errorStatus(status: number) {
  return (error: unknown) =>
    !!error && typeof error === 'object' && 'status' in error && error.status === status
}
const challenge = () => ({
  success: true,
  action: 'inquiry',
  hostname: 'portal.example',
  challenge_ts: new Date().toISOString(),
})
function fakePool(query: () => Promise<unknown> = async () => ({ rows: [], rowCount: 1 })) {
  return { connect: async () => ({ query, release: () => {} }) }
}

test('proxy trust rejects forwarded lists and canonicalizes equivalent addresses', () => {
  const headers = new Headers({ 'x-forwarded-for': '198.51.100.1', 'x-real-ip': '198.51.100.2' })
  assert.equal(inquiryClientIP(headers, ''), 'unknown')
  assert.equal(
    inquiryClientIP(new Headers({ trusted: '198.51.100.1, 198.51.100.2' }), 'trusted'),
    'unknown',
  )
  assert.equal(inquiryClientIP(new Headers({ trusted: 'not-an-address' }), 'trusted'), 'unknown')
  assert.equal(inquiryClientIP(new Headers({ trusted: 'fe80::1%eth0' }), 'trusted'), 'unknown')
  assert.equal(
    inquiryClientIP(new Headers({ trusted: '2001:0db8:0:0:0:0:0:1' }), 'trusted'),
    '2001:db8::1',
  )
  assert.equal(
    inquiryClientIP(new Headers({ trusted: '::ffff:192.0.2.1' }), 'trusted'),
    '192.0.2.1',
  )
})

test('privacy keys normalize email and separate identity namespaces', () => {
  const hash = inquiryPrivacyKey(secret, 'email', ' Alice@Example.COM ')
  assert.equal(hash, inquiryPrivacyKey(secret, 'email', 'alice@example.com'))
  assert.match(hash, /^[a-f0-9]{64}$/)
  assert.notEqual(hash, inquiryPrivacyKey(secret, 'ip', 'alice@example.com'))
  assert.notEqual(hash, inquiryPrivacyKey(`${secret}-rotated`, 'email', 'alice@example.com'))
})

test('challenge requires successful fresh response with exact hostname and action', () => {
  const now = Date.now()
  const valid = { ...challenge(), challenge_ts: new Date(now).toISOString() }
  assert.equal(validInquiryChallenge(valid, ['portal.example'], now), true)
  for (const patch of [
    { success: false },
    { hostname: 'portal.example.evil.test' },
    { action: 'login' },
    { challenge_ts: new Date(now - 300001).toISOString() },
    { challenge_ts: new Date(now + 1).toISOString() },
    { challenge_ts: 'invalid' },
  ])
    assert.equal(validInquiryChallenge({ ...valid, ...patch }, ['portal.example'], now), false)
})

test('production cannot enable the development bypass or use provider test secrets', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  Object.assign(process.env, { NODE_ENV: 'production', INQUIRY_PROTECTION_MODE: 'development' })
  try {
    await assert.rejects(enforceInquiryAbuse(request(), 'person@example.com', ''), errorStatus(503))
    process.env.INQUIRY_PROTECTION_MODE = 'enforce'
    process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA'
    globalThis.fetch = async () => Response.json(challenge())
    await assert.rejects(
      enforceInquiryAbuse(request(fakePool()), 'person@example.com', 'token'),
      errorStatus(503),
    )
  } finally {
    globalThis.fetch = originalFetch
    Object.assign(process.env, environment)
    if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Object.assign(process.env, { NODE_ENV: previousNodeEnv })
  }
})

test('unavailable store fails closed with retry metadata', async () => {
  const req = request(
    fakePool(async () => {
      throw new Error('Database is unavailable')
    }),
  )
  await assert.rejects(consumeInquiryLimits(req, 'person@example.com', config), errorStatus(503))
  assert.equal(req.responseHeaders?.get('Retry-After'), '60')
})

test('connection deadline fails closed and releases a connection arriving late', async () => {
  let finishConnecting: (client: { release: () => void }) => void = () => {}
  let released = false
  const req = request({
    connect: () =>
      new Promise((resolve) => {
        finishConnecting = resolve
      }),
  })
  await assert.rejects(consumeInquiryLimits(req, 'person@example.com', config), errorStatus(503))
  finishConnecting({
    release: () => {
      released = true
    },
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(released, true)
})

test('provider outages, malformed responses and invalid metadata fail closed', async () => {
  try {
    for (const providerResponse of [
      new Response('', { status: 503 }),
      Response.json({ success: false, 'error-codes': ['internal-error'] }),
      Response.json({ success: true, 'error-codes': 'malformed' }),
    ]) {
      globalThis.fetch = async () => providerResponse
      await assert.rejects(
        enforceInquiryAbuse(request(fakePool()), 'person@example.com', randomUUID()),
        errorStatus(503),
      )
    }
    for (const patch of [
      { hostname: 'evil.test' },
      { action: 'login' },
      { challenge_ts: '2000-01-01' },
    ]) {
      globalThis.fetch = async () => Response.json({ ...challenge(), ...patch })
      await assert.rejects(
        enforceInquiryAbuse(request(fakePool()), 'person@example.com', randomUUID()),
        errorStatus(400),
      )
    }
    globalThis.fetch = async () => {
      throw new Error('Provider network unavailable')
    }
    await assert.rejects(
      enforceInquiryAbuse(request(fakePool()), 'person@example.com', randomUUID()),
      errorStatus(503),
    )
    globalThis.fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('Provider timeout')), {
          once: true,
        })
      })
    // AbortSignal.timeout uses an unref'ed timer, so keep this fixture alive.
    const keepAlive = setInterval(() => {}, 1000)
    try {
      await assert.rejects(
        enforceInquiryAbuse(request(fakePool()), 'person@example.com', randomUUID()),
        errorStatus(503),
      )
    } finally {
      clearInterval(keepAlive)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test(
  'PostgreSQL shared counters, expiry, transaction independence and replay reservations',
  {
    skip: !process.env.INQUIRY_TEST_DATABASE_URI,
  },
  async (t) => {
    const testURL = new URL(process.env.INQUIRY_TEST_DATABASE_URI!)
    assert.ok(
      ['localhost', '127.0.0.1'].includes(testURL.hostname),
      'Use a disposable local PostgreSQL database',
    )
    // This test drops only the unique schema it creates.
    const { Pool } = pg
    const schema = `inquiry_test_${randomUUID().replaceAll('-', '')}`
    const admin = new Pool({ connectionString: process.env.INQUIRY_TEST_DATABASE_URI })
    const pool = new Pool({
      connectionString: process.env.INQUIRY_TEST_DATABASE_URI,
      options: `-c search_path=${schema}`,
      max: 20,
    })
    const otherPool = new Pool({
      connectionString: process.env.INQUIRY_TEST_DATABASE_URI,
      options: `-c search_path=${schema}`,
      max: 20,
    })
    try {
      await admin.query(`CREATE SCHEMA ${schema}`)
      await pool.query(`CREATE TABLE inquiry_rate_limits (bucket_key text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL);
      CREATE TABLE inquiry_challenge_tokens (token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL);`)
      await t.test(
        'concurrent normalized email requests cannot exceed the shared budget',
        async () => {
          const attempts = await Promise.allSettled(
            Array.from({ length: 20 }, (_, index) =>
              consumeInquiryLimits(
                request(index % 2 ? pool : otherPool, `192.0.2.${index + 1}`),
                index % 2 ? 'PERSON@example.com' : ' person@example.com ',
                config,
              ),
            ),
          )
          assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 3)
          for (const attempt of attempts)
            if (attempt.status === 'rejected') assert.equal(attempt.reason.status, 429)
        },
      )
      await pool.query('TRUNCATE inquiry_rate_limits')
      await t.test(
        'rotating email cannot exceed IP budget and retry includes a deadline',
        async () => {
          const requests = Array.from({ length: 20 }, (_, index) =>
            request(index % 2 ? pool : otherPool),
          )
          const attempts = await Promise.allSettled(
            requests.map((req, index) =>
              consumeInquiryLimits(req, `person${index}@example.com`, { ...config, ipMax: 4 }),
            ),
          )
          assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 4)
          assert.ok(requests.some((req) => Number(req.responseHeaders?.get('Retry-After')) > 0))
        },
      )
      await pool.query('TRUNCATE inquiry_rate_limits')
      await t.test(
        'application rollback leaves counters committed and expiry restores capacity',
        async () => {
          const transaction = await pool.connect()
          try {
            await transaction.query('BEGIN')
            await consumeInquiryLimits(request(pool), 'person@example.com', {
              ...config,
              emailMax: 1,
            })
            await transaction.query('ROLLBACK')
            await assert.rejects(
              consumeInquiryLimits(request(pool), 'person@example.com', { ...config, emailMax: 1 }),
              errorStatus(429),
            )
            await pool.query(
              "UPDATE inquiry_rate_limits SET expires_at = NOW() - INTERVAL '1 second'",
            )
            await consumeInquiryLimits(request(pool), 'person@example.com', {
              ...config,
              emailMax: 1,
            })
          } finally {
            transaction.release()
          }
        },
      )
      await pool.query('TRUNCATE inquiry_rate_limits')
      await t.test(
        'concurrent replay succeeds only once across requests and stores only hashes',
        async () => {
          const token = randomUUID()
          let providerCalls = 0
          globalThis.fetch = async () => {
            providerCalls++
            return Response.json(challenge())
          }
          try {
            const attempts = await Promise.allSettled(
              Array.from({ length: 10 }, (_, index) =>
                enforceInquiryAbuse(
                  request(index % 2 ? pool : otherPool),
                  'person@example.com',
                  token,
                ),
              ),
            )
            assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1)
            assert.equal(providerCalls, 1)
            for (const attempt of attempts)
              if (attempt.status === 'rejected') assert.equal(attempt.reason.status, 400)
            const stored = await pool.query('SELECT token_hash FROM inquiry_challenge_tokens')
            assert.equal(stored.rows.length, 1)
            assert.match(stored.rows[0].token_hash, /^[a-f0-9]{64}$/)
            assert.notEqual(stored.rows[0].token_hash, token)
          } finally {
            globalThis.fetch = originalFetch
          }
        },
      )
    } finally {
      await pool.end()
      await otherPool.end()
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
      await admin.end()
    }
  },
)
