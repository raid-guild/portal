/** Integration check: run only against a migrated, disposable local inquiry_tests DB. */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { inquiryAccountLinkContext } from '../src/utilities/inquiryIntake'

const url = new URL(process.env.DATABASE_URI || 'postgres://invalid/invalid')
assert.ok(
  ['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/inquiry_tests',
  'Use the disposable local inquiry_tests database',
)
Object.assign(process.env, {
  INQUIRY_PROTECTION_MODE: 'enforce',
  INQUIRY_RATE_LIMIT_SECRET: 'local-inquiry-tests-at-least-32-characters',
  TURNSTILE_SECRET_KEY: 'local-test-secret',
  TURNSTILE_ALLOWED_HOSTNAMES: 'localhost',
  INQUIRY_RATE_LIMIT_IP_MAX: '100',
  INQUIRY_RATE_LIMIT_EMAIL_MAX: '100',
})
const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init) =>
  String(input) === 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    ? Response.json({
        success: JSON.parse(String(init?.body)).response.startsWith('local-'),
        hostname: 'localhost',
        action: 'inquiry',
        challenge_ts: new Date(Date.now() - 1000).toISOString(),
      })
    : originalFetch(input, init)
const payload = await getPayload({ config })
const data = () => ({
  type: 'general' as const,
  name: 'Local integration fixture',
  email: `${randomUUID()}@example.com`,
  message: 'Only a local test',
  turnstileToken: `local-${randomUUID()}`,
})
try {
  const historical = await payload.find({
    collection: 'inquiries',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  await assert.rejects(
    payload.create({
      collection: 'inquiries',
      data: { ...data(), turnstileToken: undefined },
      overrideAccess: true,
    }),
    (error: { status?: number }) => error.status === 400,
  )
  await assert.rejects(
    payload.create({
      collection: 'inquiries',
      data: { ...data(), status: 'converted' },
      context: { skipInquiryProtection: true },
      overrideAccess: true,
    }),
    (error: { status?: number }) => error.status === 400,
  )
  const anonymous = await payload.create({
    collection: 'inquiries',
    data: data(),
    overrideAccess: true,
  })
  assert.equal(anonymous.status, 'reviewing')
  assert.equal(anonymous.intakeReviewReason, 'pending-review')
  assert.equal(anonymous.accountLinkStatus, 'unlinked')
  assert.equal(anonymous.submitterUser, null)
  const trapped = await payload.create({
    collection: 'sponsorInquiries',
    data: {
      name: 'Local sponsor',
      email: `${randomUUID()}@example.com`,
      organization: 'Fixture',
      sponsorType: 'project-opportunity',
      opportunity: 'Only local',
      website: 'honeypot',
      turnstileToken: `local-${randomUUID()}`,
    },
    overrideAccess: true,
  })
  assert.equal(trapped.status, 'reviewing')
  assert.equal(trapped.intakeReviewReason, 'honeypot')
  const user = await payload.create({
    collection: 'users',
    data: { email: anonymous.email, password: 'LocalTest123!', name: 'Local account' },
    context: { skipSignupProtection: true, skipWelcomeEmail: true },
  })
  const linked = await payload.findByID({ collection: 'inquiries', id: anonymous.id, depth: 0 })
  assert.equal(linked.accountLinkStatus, 'linked')
  assert.equal(linked.submitterUser, user.id)
  const sessionData = data()
  const session = await payload.create({
    collection: 'inquiries',
    data: sessionData,
    depth: 0,
    user: { ...user, roles: ['member'] },
    overrideAccess: false,
  })
  assert.equal(session.submitterUser, user.id)
  assert.equal(session.accountLinkStatus, 'linked')
  await assert.rejects(
    payload.update({
      collection: 'inquiries',
      id: session.id,
      data: { status: 'converted' },
      overrideAccess: true,
    }),
    (error: { status?: number }) => error.status === 403,
  )
  await payload.update({
    collection: 'inquiries',
    id: session.id,
    data: { accountLinkStatus: 'linked', submitterUser: user.id },
    context: inquiryAccountLinkContext(user.id),
    overrideAccess: true,
  })
  for (const before of historical.docs) {
    const after = await payload.findByID({ collection: 'inquiries', id: before.id, depth: 0 })
    assert.deepEqual(after, before)
  }
  console.log(
    'Local API: public overrideAccess bypass blocked; both collections quarantined; session identity and signup linking preserved; unrelated rows unchanged.',
  )
} finally {
  globalThis.fetch = originalFetch
  await payload.destroy()
}
