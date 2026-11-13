import { expect, test, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { installInquiryChallenge } from './inquiry-challenge'
import { adminEmail, adminPassword } from './env'

const headers = () => ({
  'x-e2e-client-ip': `2001:db8:${randomUUID().replaceAll('-', '').slice(0, 24).match(/.{4}/g)!.join(':')}`,
})
const token = (kind = 'valid') => `e2e-${kind}-${randomUUID()}`
const inquiry = (patch: Record<string, unknown> = {}) => ({
  type: 'general',
  name: 'Inquiry security fixture',
  email: `${randomUUID()}@example.com`,
  message: '<img src=x onerror=alert(1)> SELECT * FROM users;',
  turnstileToken: token(),
  ...patch,
})
const sponsor = (patch: Record<string, unknown> = {}) => ({
  name: 'Sponsor security fixture',
  email: `${randomUUID()}@example.com`,
  organization: 'Local fixture',
  sponsorType: 'project-opportunity',
  opportunity: 'Local verification only',
  turnstileToken: token(),
  ...patch,
})
const post = (
  request: APIRequestContext,
  data: Record<string, unknown>,
  collection = 'inquiries',
  extraHeaders = headers(),
) => request.post(`/api/${collection}`, { data, headers: extraHeaders })

test('public REST validates raw shapes and protected fields before storing', async ({
  request,
}) => {
  for (const patch of [
    { status: 'converted' },
    { notes: 'injected' },
    { submitterUser: 1 },
    { accountLinkStatus: 'linked' },
    { submitterProfile: 1 },
    { intakeReviewReason: 'approved' },
    { name: 123 },
    { organization: { nested: true } },
    { message: 'x'.repeat(4001) },
    { links: [{ label: 'x', url: 'javascript:alert(1)' }] },
    { links: [{ id: '507f1f77bcf86cd799439011', label: 'x', url: 'https://example.com/' }] },
    { links: Array.from({ length: 6 }, () => ({ label: 'x', url: 'https://example.com' })) },
    { relatedProject: 2147483647 },
    { context: { skipInquiryProtection: true } },
  ])
    expect((await post(request, inquiry(patch))).status()).toBe(400)
  expect(
    (await post(request, sponsor({ reviewNotes: 'injected' }), 'sponsorInquiries')).status(),
  ).toBe(400)
  expect(
    (await post(request, sponsor({ canShowPublicly: 'true' }), 'sponsorInquiries')).status(),
  ).toBe(400)
  expect(
    (
      await post(
        request,
        sponsor({
          links: [{ id: '507f1f77bcf86cd799439011', label: 'x', url: 'https://example.com/' }],
        }),
        'sponsorInquiries',
      )
    ).status(),
  ).toBe(400)
  const result = await post(request, inquiry())
  expect(result.status()).toBe(201)
  const { doc } = await result.json()
  expect(doc.status).toBe('reviewing')
  expect(doc.message).toContain('<img src=x onerror=alert(1)>')
  expect(doc.accountLinkStatus).toBe('unlinked')
  expect(doc.submitterUser).toBeFalsy()
  expect(doc).not.toHaveProperty('turnstileToken')
  expect(doc).not.toHaveProperty('website')
  expect((await request.get(`/api/inquiries/${doc.id}`)).status()).toBe(403)
  const legacy = await post(
    request,
    sponsor({ website: 'filled honeypot', canShowPublicly: true }),
    'sponsorInquiries',
  )
  expect(legacy.status()).toBe(201)
  expect((await legacy.json()).doc.status).toBe('reviewing')
})

test('server rejects missing, invalid, expired, replayed and mismatched challenges', async ({
  request,
}) => {
  for (const challenge of [
    undefined,
    '',
    token('invalid'),
    token('expired'),
    token('host'),
    token('action'),
  ]) {
    expect((await post(request, inquiry({ turnstileToken: challenge }))).status()).toBe(400)
  }
  const replayToken = token()
  expect((await post(request, inquiry({ turnstileToken: replayToken }))).status()).toBe(201)
  expect(
    (await post(request, sponsor({ turnstileToken: replayToken }), 'sponsorInquiries')).status(),
  ).toBe(400)
  const outage = await post(request, inquiry({ turnstileToken: token('outage') }))
  expect(outage.status()).toBe(503)
})

test('both collections share atomic normalized-email and IP budgets', async ({ request }) => {
  const email = `${randomUUID()}@example.com`
  const attempts = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      index % 2
        ? post(request, inquiry({ email: ` ${email.toUpperCase()} ` }))
        : post(request, sponsor({ email }), 'sponsorInquiries'),
    ),
  )
  expect(attempts.filter((result) => result.status() === 201)).toHaveLength(3)
  expect(attempts.filter((result) => result.status() === 429)).toHaveLength(5)
  const limited = attempts.find((result) => result.status() === 429)!
  expect(Number(limited.headers()['retry-after'])).toBeGreaterThan(0)
  const shared = headers()
  const ipAttempts = await Promise.all(
    Array.from({ length: 14 }, () => post(request, inquiry(), 'inquiries', shared)),
  )
  expect(ipAttempts.filter((result) => result.status() === 201)).toHaveLength(10)
  expect(ipAttempts.filter((result) => result.status() === 429)).toHaveLength(4)
})

test('GraphQL uses the same collection boundary', async ({ request }) => {
  const query = `mutation($data: mutationInquiryInput!) { createInquiry(data: $data) { id status name } }`
  const send = (data: Record<string, unknown>) =>
    request.post('/api/graphql', { data: { query, variables: { data } }, headers: headers() })
  for (const data of [inquiry({ turnstileToken: '' }), inquiry({ status: 'converted' })]) {
    const body = await (await send(data)).json()
    expect(body.errors).toBeTruthy()
    expect(body.data?.createInquiry).toBeFalsy()
  }
  const body = await (await send(inquiry())).json()
  expect(body.errors).toBeUndefined()
  expect(body.data?.createInquiry.status).toBe('reviewing')
})

test('challenge expiry and temporary failures preserve accessible form retry', async ({ page }) => {
  await page.setExtraHTTPHeaders(headers())
  await installInquiryChallenge(page)
  await page.goto('/inquire/general')
  await page.getByLabel(/^Name$/).fill('Retry fixture')
  await page.getByLabel(/^Email$/).fill(`${randomUUID()}@example.com`)
  await page.getByLabel(/what should we know/i).fill('Keep these entries after an outage.')
  await expect(page.getByText('Verification complete.')).toBeVisible()
  await page.evaluate(() =>
    (
      window as unknown as { inquiryChallengeOptions: Record<string, () => void> }
    ).inquiryChallengeOptions['expired-callback'](),
  )
  await expect(page.getByRole('button', { name: 'Start inquiry' })).toBeDisabled()
  await expect(page.getByRole('status').filter({ hasText: 'Verification expired' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry verification' }).click()
  await expect(page.getByRole('button', { name: 'Start inquiry' })).toBeEnabled()
  let unavailable = true
  await page.route('**/api/inquiries', (route) => {
    if (unavailable) {
      unavailable = false
      return route.fulfill({ status: 503, body: '{}' })
    }
    return route.continue()
  })
  await page.getByRole('button', { name: 'Start inquiry' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'temporarily unavailable' })).toBeVisible()
  await expect(page.getByLabel(/^Name$/)).toHaveValue('Retry fixture')
  await expect(page.getByLabel(/what should we know/i)).toHaveValue(
    'Keep these entries after an outage.',
  )
  await page.getByRole('button', { name: 'Start inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Continue your RaidGuild intake' })).toBeVisible()
})

test('legacy sponsor form accepts verified anonymous intake', async ({ page }) => {
  await page.setExtraHTTPHeaders(headers())
  await installInquiryChallenge(page)
  await page.goto('/sponsor')
  await page.getByLabel(/^Name$/).fill('Sponsor browser fixture')
  await page.getByLabel(/^Email$/).fill(randomUUID() + '@example.com')
  await page.getByLabel(/Organization/).fill('Local browser fixture')
  await page.getByLabel(/What are you bringing/).fill('A real local test submission.')
  await page.getByRole('button', { name: 'Submit sponsor inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Sponsor inquiry received' })).toBeVisible()
})

test('admin create forms save links with generated row IDs in both collections', async ({
  page,
}) => {
  const login = await page.request.post('/api/users/login', {
    data: { email: adminEmail, password: adminPassword },
  })
  expect(login.status()).toBe(200)

  for (const collection of ['inquiries', 'sponsorInquiries']) {
    await page.goto(`/admin/collections/${collection}/create`)
    await page.locator('input[name="name"]').fill('Admin link regression fixture')
    await page.locator('input[name="email"]').fill(`${randomUUID()}@example.com`)
    if (collection === 'inquiries') {
      await page.locator('#field-type').getByRole('combobox').click()
      await page.getByRole('option', { name: 'General guild inquiry', exact: true }).click()
      await page.locator('textarea[name="message"]').fill('Admin inquiry with a link.')
    } else {
      await page.locator('input[name="organization"]').fill('Local fixture')
      await page.locator('textarea[name="opportunity"]').fill('Admin sponsor inquiry with a link.')
    }
    await page.getByRole('button', { name: 'Add Link', exact: true }).click()
    await page.locator('input[name="links.0.label"]').fill('Fixture')
    await page.locator('input[name="links.0.url"]').fill('https://example.com/')
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/${collection}`) && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    const response = await saved
    expect(response.status()).toBe(201)
    // Assert the actual admin link row ID was sent and replaced on create.
    const form = await new Response(response.request().postData(), {
      headers: { 'content-type': response.request().headers()['content-type'] },
    }).formData()
    const submitted = JSON.parse(String(form.get('_payload')))
    expect(submitted.links[0].id).toEqual(expect.any(String))
    const { doc } = await response.json()
    expect(doc.links).toHaveLength(1)
    expect(doc.links[0]).toMatchObject({ label: 'Fixture', url: 'https://example.com/' })
    expect(doc.links[0].id).not.toBe(submitted.links[0].id)
    await expect(page).toHaveURL(new RegExp(`/admin/collections/${collection}/${doc.id}$`))
    await page.reload()
    await expect(page.locator('input[name="links.0.url"]')).toHaveValue('https://example.com/')
  }
})
