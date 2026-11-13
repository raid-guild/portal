import assert from 'node:assert/strict'
import test from 'node:test'
import {
  finalizeInquiryIntake,
  normalizeInquiryInput,
  protectInquiryOperation,
  inquiryAccountLinkContext,
} from '../src/utilities/inquiryIntake'
import type { CollectionBeforeOperationHook, CollectionBeforeValidateHook } from 'payload'

const valid = { type: 'general', name: 'Visitor', email: ' Visitor@Example.com ', message: 'Hello' }
test('strict public input bounds and normalization precede Payload coercion', () => {
  assert.equal(normalizeInquiryInput(valid, 'inquiries').email, 'visitor@example.com')
  for (const bad of [
    { name: 123 },
    { message: 'Invalid\0database text' },
    { message: { text: 'hello' } },
    { message: 'x'.repeat(4001) },
    { name: ' ' },
    { type: 'invalid' },
    { email: 'bad' },
    { organization: [] },
    { links: Array.from({ length: 6 }, () => ({ label: 'link', url: 'https://example.com' })) },
    { links: [{ label: 'link', url: 'javascript:alert(1)' }] },
    { links: [{ label: 'link', url: 'https://user:pass@example.com' }] },
    { links: [{ label: 'link', url: 'https://example.com', id: 'injected' }] },
    { relatedProject: '1' },
    { sourceRoute: 'x'.repeat(257) },
    { status: 'converted' },
    { notes: 'injected' },
    { accountLinkStatus: 'linked' },
    { submitterUser: 1 },
    { submitterProfile: 1 },
    { intakeReviewReason: 'approved' },
    { context: { skipInquiryProtection: true } },
    { createdAt: '2020-01-01' },
  ])
    assert.throws(
      () => normalizeInquiryInput({ ...valid, ...bad }, 'inquiries'),
      /Invalid inquiry field/,
    )
  assert.throws(() =>
    normalizeInquiryInput(
      {
        name: 'Visitor',
        email: 'test@example.com',
        organization: 'Org',
        opportunity: 'Hello',
        canShowPublicly: 'true',
      },
      'sponsorInquiries',
    ),
  )
})

test('attack-shaped text remains ordinary text, with no keyword rejection', () => {
  const message = '<img src=x onerror=alert(1)> SELECT * FROM users;'
  assert.equal(normalizeInquiryInput({ ...valid, message }, 'inquiries').message, message)
})

test('finalization derives identity and quarantine only on create', async () => {
  const run = (data: Record<string, unknown>, operation: string, user: unknown = null) =>
    finalizeInquiryIntake({
      data,
      operation,
      collection: { slug: 'inquiries' },
      req: { user },
    } as Parameters<CollectionBeforeValidateHook>[0])
  const data = await run(
    { ...valid, website: 'trap', submitterUser: 999, submitterProfile: 999, status: 'new' },
    'create',
    { id: 12, roles: ['member'] },
  )
  assert.equal(data.status, 'reviewing')
  assert.equal(data.intakeReviewReason, 'honeypot')
  assert.equal(data.submitterUser, 12)
  assert.equal(data.submitterProfile, null)
  assert.equal(data.accountLinkStatus, 'linked')
  assert.equal(data.website, undefined)
  const prior = { status: 'new', name: 'Historical inquiry' }
  assert.equal(await run(prior, 'update'), prior)
  assert.equal(prior.status, 'new')
})

test('overrideAccess and string context flags cannot authorize account-link updates', async () => {
  const run = (
    context: unknown,
    data = { accountLinkStatus: 'linked', submitterUser: 12 },
    api = 'local',
  ) =>
    protectInquiryOperation({
      operation: 'update',
      overrideAccess: true,
      collection: { slug: 'inquiries' },
      args: { data },
      req: { user: null, context, payloadAPI: api },
    } as unknown as Parameters<CollectionBeforeOperationHook>[0])
  await assert.rejects(async () => run({ skipInquiryProtection: true }), /require an editor/)
  await assert.rejects(async () => run(inquiryAccountLinkContext(13)), /require an editor/)
  await assert.rejects(
    async () => run(inquiryAccountLinkContext(12), undefined, 'REST'),
    /require an editor/,
  )
  await assert.rejects(
    async () =>
      run(inquiryAccountLinkContext(12), {
        accountLinkStatus: 'linked',
        submitterUser: 12,
        status: 'converted',
      } as never),
    /require an editor/,
  )
  assert.ok(await run(inquiryAccountLinkContext(12)))
})
