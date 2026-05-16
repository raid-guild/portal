import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'

import {
  adminEmail,
  adminPassword,
  agentRegistrationSecret,
  commentText,
  seededPosts,
  targetPost,
} from './env'

const manualReviewMode = process.env.E2E_MANUAL_REVIEW === 'true'

async function maybeFill(page: Page, label: RegExp, value: string) {
  const field = page.getByLabel(label)

  if (await field.count()) {
    await field.fill(value)
  }
}

async function fillFirst(locator: Locator, value: string) {
  await expect(locator.first()).toBeVisible()
  await locator.first().fill(value)
}

async function fillVisiblePasswordFields(page: Page, value: string) {
  const namedPassword = page.locator('input[name="password"]')
  const namedConfirmPassword = page.locator('input[name="confirmPassword"]')

  if (await namedPassword.count()) {
    await fillFirst(namedPassword, value)
  }

  if (await namedConfirmPassword.count()) {
    await fillFirst(namedConfirmPassword, value)
    return
  }

  const visiblePasswordInputs = page.locator('input[type="password"]:visible')
  const count = await visiblePasswordInputs.count()

  for (let index = 0; index < count; index += 1) {
    await visiblePasswordInputs.nth(index).fill(value)
  }
}

async function expectSeedButton(page: Page, timeout = 15000) {
  await expect(page.getByText(/without clearing existing CMS content/i)).toBeVisible({ timeout })
  await expect(page.getByRole('button', { name: /upsert portal starter content/i })).toBeVisible({
    timeout,
  })
}

async function createFirstAdmin(page: Page) {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/create-first-user/)

  if (await page.locator('input[name="email"]').count()) {
    await fillFirst(page.locator('input[name="email"]'), adminEmail)
  } else {
    await fillFirst(page.getByLabel(/email/i), adminEmail)
  }

  await maybeFill(page, /^name$/i, 'Playwright Admin')
  await fillVisiblePasswordFields(page, adminPassword)

  await page
    .getByRole('button', {
      name: /create( first user)?|continue|create/i,
    })
    .first()
    .click({ force: true })

  try {
    await expectSeedButton(page, 5000)
    return
  } catch {
    const response = await page.request.post('/api/users/first-register', {
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Playwright Admin',
      },
    })

    if (!response.ok()) {
      throw new Error(`First user registration failed with status ${response.status()}`)
    }

    await page.goto('/admin')
  }

  await expectSeedButton(page)
}

async function seedDatabase(page: Page) {
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: /upsert portal starter content/i }).click()
  await expect(page.getByText(/portal starter content upserted/i)).toBeVisible({ timeout: 120000 })
}

async function approveComment(page: Page) {
  await page.goto('/admin/collections/comments')

  const commentLink = page.getByRole('link', { name: commentText }).first()
  await expect(commentLink).toBeVisible({ timeout: 30000 })
  await commentLink.click()

  const isApproved = page.getByRole('checkbox', { name: /is approved/i })
  const saveButton = page.getByRole('button', { name: /^save$/i }).first()

  await expect(isApproved).toBeVisible()
  if (!(await isApproved.isChecked())) {
    await isApproved.click()
  }

  if (await saveButton.isDisabled()) {
    await isApproved.click()
    await isApproved.click()
  }

  if (await saveButton.isEnabled()) {
    await saveButton.click()
  } else {
    const commentID = page.url().match(/\/comments\/(\d+)/)?.[1]

    if (!commentID) {
      throw new Error('Unable to determine comment ID for approval fallback')
    }

    const response = await page.request.patch(`/api/comments/${commentID}`, {
      data: {
        isApproved: true,
        publishedAt: new Date().toISOString(),
      },
    })

    if (!response.ok()) {
      throw new Error(`Comment approval fallback failed with status ${response.status()}`)
    }

    await page.reload()
  }

  await expect(isApproved).toBeChecked()
}

async function getApprovedCommentCount(page: Page) {
  const response = await page.request.get('/api/comments', {
    params: {
      depth: '0',
      limit: '10',
      'where[content][equals]': commentText,
      'where[isApproved][equals]': 'true',
    },
  })

  expect(response.ok()).toBeTruthy()

  const body = await response.json()

  return body.docs.length as number
}

async function verifySeededPosts(page: Page) {
  await page.goto('/posts')
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()

  for (const post of seededPosts) {
    await expect(page.getByRole('link', { name: post.title })).toBeVisible()

    const response = await page.goto(`/posts/${post.slug}`)

    expect(
      response?.ok(),
      `Expected seeded post page /posts/${post.slug} to respond successfully`,
    ).toBeTruthy()
    await expect(page.getByRole('heading', { exact: true, name: post.title })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible()
  }
}

async function verifyPublicHome(page: Page) {
  await page.goto('/')
  const header = page.locator('header').first()

  await expect(header.getByRole('link', { name: 'Posts' })).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Find the work already in motion.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join RaidGuild' })).toBeVisible()
  await expect(page.getByText('Bringing a project or bounty?')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sponsor an opportunity' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Next public session' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upcoming Sessions' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Weekly Brief: Project Spike Momentum' }),
  ).toBeVisible()
  await expect(
    page.getByText('The weekly media export will appear here when it is attached.'),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join for daily briefs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View sessions' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ready to participate?' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join the portal' })).toBeVisible()
}

async function verifySeededProjectSpike(page: Page) {
  await page.goto('/projects')
  await expect(page.getByRole('heading', { name: 'Active project spikes' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cohort Project Spike Portal' })).toBeVisible()
  await page.getByRole('link', { name: 'View project' }).click()

  await expect(page).toHaveURL(/\/projects\/cohort-project-spike-portal/)
  await expect(page.getByRole('heading', { name: 'Cohort Project Spike Portal' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What is happening' })).toBeVisible()
  await expect(page.getByText('Defining the project spike object')).toBeVisible()
  await expect(page.getByText('Calendar and session coordination')).toBeVisible()
  await expect(
    page.getByText('Group narrowed the portal around project spikes instead of broad PM tooling.'),
  ).toBeVisible()
  await expect(page.getByText('Cohort Project Spike Sync')).toBeVisible()
  await expect(page.getByText('Discord #cohort-voice')).toBeVisible()
  await expect(page.getByText('Render the Update Brief')).toBeVisible()
}

async function verifyMemberOnlyProjectVisibility(
  adminPage: Page,
  browser: Browser,
  publicPage: Page,
) {
  const memberOnlyProjectTitle = 'Member Only Project Spike'
  const memberOnlyProjectSlug = 'member-only-project-spike'
  const memberEmail = 'project-member@example.com'
  const contributorEmail = 'project-contributor@example.com'
  const password = 'ChangeMe123!'

  const projectResponse = await adminPage.request.post('/api/projects', {
    data: {
      title: memberOnlyProjectTitle,
      summary: 'A project spike that should only be visible to users with the member role.',
      currentState: [
        {
          body: 'Member-only collaboration details are visible after member login.',
        },
      ],
      lastActiveAt: new Date().toISOString(),
      projectStatus: 'active',
      publishedAt: new Date().toISOString(),
      slug: memberOnlyProjectSlug,
      slugLock: true,
      visibility: 'member',
      _status: 'published',
    },
  })

  expect(projectResponse.status()).toBe(201)

  const memberResponse = await adminPage.request.post('/api/users', {
    data: {
      email: memberEmail,
      name: 'Project Member',
      password,
      roles: ['member'],
    },
  })

  expect(memberResponse.status()).toBe(201)

  const contributorResponse = await adminPage.request.post('/api/users', {
    data: {
      email: contributorEmail,
      name: 'Project Contributor',
      password,
      roles: ['contributor'],
    },
  })

  expect(contributorResponse.status()).toBe(201)

  await publicPage.goto('/projects')
  await expect(publicPage.getByRole('heading', { name: memberOnlyProjectTitle })).toHaveCount(0)
  const publicDetailResponse = await publicPage.goto(`/projects/${memberOnlyProjectSlug}`)
  expect(publicDetailResponse?.status()).toBe(404)

  const contributorContext = await browser.newContext()
  const contributorPage = await contributorContext.newPage()
  await contributorPage.goto('/login')
  await fillFirst(contributorPage.getByLabel(/^email$/i), contributorEmail)
  await fillFirst(contributorPage.getByLabel(/^password$/i), password)
  await contributorPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(contributorPage).toHaveURL(/\/dashboard/)
  await contributorPage.goto('/projects')
  await expect(contributorPage.getByRole('heading', { name: memberOnlyProjectTitle })).toHaveCount(
    0,
  )
  const contributorDetailResponse = await contributorPage.goto(`/projects/${memberOnlyProjectSlug}`)
  expect(contributorDetailResponse?.status()).toBe(404)
  await contributorContext.close()

  const memberContext = await browser.newContext()
  const memberPage = await memberContext.newPage()
  await memberPage.goto('/login')
  await fillFirst(memberPage.getByLabel(/^email$/i), memberEmail)
  await fillFirst(memberPage.getByLabel(/^password$/i), password)
  await memberPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(memberPage).toHaveURL(/\/dashboard/)
  await memberPage.goto('/projects')
  await expect(memberPage.getByRole('heading', { name: memberOnlyProjectTitle })).toBeVisible()
  await memberPage.goto(`/projects/${memberOnlyProjectSlug}`)
  await expect(memberPage.getByRole('heading', { name: memberOnlyProjectTitle })).toBeVisible()
  await expect(memberPage.getByText('Member-only collaboration details')).toBeVisible()
  await memberContext.close()
}

async function verifySeededSessions(page: Page) {
  await page.goto('/events')
  await expect(page.getByRole('heading', { name: 'Cohort sessions' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible()
  await expect(page.getByText('Cohort Project Spike Sync')).toBeVisible()
  await expect(page.getByText('Discord #cohort-voice')).toBeVisible()
  await expect(page.getByText('Cohort Project Spike Portal')).toBeVisible()
  await expect(page.getByText('Defining the project spike object')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add to calendar' })).toBeVisible()
}

async function verifyPortalSkillEndpoint(page: Page) {
  const response = await page.request.get('/api/portal/skills/portal-memory-publisher')

  expect(response.ok()).toBeTruthy()

  const body = await response.json()

  expect(body.name).toBe('portal-memory-publisher')
  expect(body.files['SKILL.md']).toContain('Portal Memory Publisher')
  expect(body.files['references/portal-cms-model.md']).toContain('activityItems')
  expect(body.files['references/example-digest-mapping.md']).toContain('Cohort Project Spike Sync')
}

async function verifyAgentRegistrationFlow(page: Page) {
  const email = 'portal-memory-agent@example.com'
  const password = 'PlaywrightAgentSecret123!'

  const registerResponse = await page.request.post('/api/agent/register', {
    data: {
      email,
      name: 'Portal Memory Agent',
      password,
    },
    headers: {
      Authorization: `Bearer ${agentRegistrationSecret}`,
    },
  })

  expect(registerResponse.status()).toBe(201)
  const registerBody = await registerResponse.json()
  expect(registerBody.user.roles).toContain('agent')

  const loginResponse = await page.request.post('/api/users/login', {
    data: {
      email,
      password,
    },
  })

  expect(loginResponse.ok()).toBeTruthy()

  const meResponse = await page.request.get('/api/users/me')
  expect(meResponse.ok()).toBeTruthy()

  const meBody = await meResponse.json()
  expect(meBody.user.roles).toContain('agent')
}

async function submitSponsorInquiry(publicPage: Page, adminPage: Page) {
  await publicPage.goto('/sponsor')
  await expect(
    publicPage.getByRole('heading', { name: 'Bring an opportunity to the cohort.' }),
  ).toBeVisible()
  await fillFirst(publicPage.getByLabel(/^name$/i), 'Sponsor Lead')
  await fillFirst(publicPage.getByLabel(/^email$/i), 'sponsor@example.com')
  await fillFirst(publicPage.getByLabel(/organization/i), 'OpenClaw Labs')
  await publicPage.getByLabel(/sponsor type/i).selectOption('bounty-paid-work')
  await publicPage.getByLabel(/budget range/i).selectOption('1k-5k')
  await fillFirst(
    publicPage.getByLabel(/what are you bringing/i),
    'A scoped bounty for contributors to package a reusable agent workflow template.',
  )
  await fillFirst(
    publicPage.getByLabel(/what kind of contributors/i),
    'TypeScript builders, product thinkers, and documentation support.',
  )
  await publicPage.getByLabel(/timeline/i).selectOption('this-month')
  await publicPage.getByLabel(/preferred next step/i).selectOption('talk-to-someone')
  await fillFirst(publicPage.getByLabel(/link label/i), 'Opportunity brief')
  await fillFirst(publicPage.getByLabel(/relevant link/i), 'https://example.com/opportunity')
  await publicPage.getByLabel(/mentioned publicly/i).check()
  await publicPage.getByRole('button', { name: /submit sponsor inquiry/i }).click()
  await expect(publicPage.getByRole('heading', { name: 'Sponsor inquiry received' })).toBeVisible()

  await adminPage.goto('/admin/collections/sponsorInquiries')
  await expect(adminPage.getByText('OpenClaw Labs')).toBeVisible({
    timeout: 30000,
  })
  await expect(adminPage.getByRole('link', { name: 'Sponsor Lead' })).toBeVisible()
}

async function verifyJoinFormEmailErrors(page: Page) {
  await page.goto('/join')
  await fillFirst(page.getByLabel(/^display name$/i), 'Email Test')
  await fillFirst(page.getByLabel(/^email$/i), 'samkuhlmann@odyssy')
  await fillFirst(page.getByLabel(/^password$/i), 'password123')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
}

async function verifyPortalLoginRedirect(page: Page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Return to the current brief.' })).toBeVisible()
  await fillFirst(page.getByLabel(/^email$/i), adminEmail)
  await fillFirst(page.getByLabel(/^password$/i), adminPassword)
  await page.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('RaidGuild Cohort')).toBeVisible()
}

async function verifyContributorAdminCreateAccess(page: Page) {
  const email = 'contributor-create@example.com'
  const password = 'ChangeMe123!'

  const createResponse = await page.request.post('/api/users', {
    data: {
      email,
      name: 'Contributor Create',
      password,
    },
  })

  expect(createResponse.status()).toBe(201)

  await page.goto('/login')
  await fillFirst(page.getByLabel(/^email$/i), email)
  await fillFirst(page.getByLabel(/^password$/i), password)
  await page.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/projects')
  await page.getByRole('link', { name: 'Create project' }).click()
  await expect(page).toHaveURL(/\/admin\/collections\/projects\/create/)
  await expect(page.getByText('Creating new Project')).toBeVisible()
  const sidebar = page.locator('aside').first()
  await expect(sidebar.getByRole('link', { name: 'Projects' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Events' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Posts' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Profiles' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Media' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'Users' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Pages' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Redirects' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Forms' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Form Submissions' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Search Results' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Sponsor Inquiries' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Point Events' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Profile Skills' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Profile Roles' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Header' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'Footer' })).toHaveCount(0)

  await page.goto('/events')
  await page.getByRole('link', { name: 'Create session' }).click()
  await expect(page).toHaveURL(/\/admin\/collections\/events\/create/)
  await expect(page.getByText('Creating new Event')).toBeVisible()

  await page.goto('/posts')
  await page.getByRole('link', { name: 'Create post' }).click()
  await expect(page).toHaveURL(/\/admin\/collections\/posts\/(create|\d+)/)
  await expect(page.getByText(/Creating new Post|Status:\s*Draft/)).toBeVisible()
}

async function createProfileAndVerifyContributorCreateLinks(page: Page) {
  await page.goto('/me')
  await expect(page.getByRole('heading', { name: 'Profile wizard' })).toBeVisible()
  await fillFirst(page.getByLabel(/^display name$/i), 'Playwright Admin')
  await fillFirst(page.getByLabel(/^handle$/i), 'playwright-admin')
  await fillFirst(
    page.getByLabel(/^bio$/i),
    'Testing member-facing profile creation and public directory display.',
  )
  await fillFirst(page.getByLabel(/^location$/i), 'Denver')
  await fillFirst(page.getByLabel(/^website$/i), 'https://example.com')
  await page.getByLabel(/^Warrior$/i).check()
  await page.getByLabel(/^Frontend Dev$/i).check()
  await page.getByRole('button', { name: /save profile/i }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()

  await page.goto('/members')
  await expect(page.getByRole('link', { name: 'Playwright Admin' })).toBeVisible()
  await expect(page.getByText('@playwright-admin')).toBeVisible()
  await page.getByRole('link', { name: 'Playwright Admin' }).click()
  await expect(page).toHaveURL(/\/members\/playwright-admin/)
  await expect(page.getByRole('heading', { name: 'Playwright Admin' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Website' })).toBeVisible()

  await page.goto('/projects')
  await expect(page.getByRole('link', { name: 'Create project' })).toHaveAttribute(
    'href',
    '/admin/collections/projects/create',
  )

  await page.goto('/events')
  await expect(page.getByRole('link', { name: 'Create session' })).toHaveAttribute(
    'href',
    '/admin/collections/events/create',
  )

  await page.goto('/posts')
  await expect(page.getByRole('link', { name: 'Create post' })).toHaveAttribute(
    'href',
    '/admin/collections/posts/create',
  )

  await page.goto('/admin/collections/projects/create')
  await expect(page).toHaveURL(/\/admin\/collections\/projects\/create/)
  await expect(page.getByText('Creating new Project')).toBeVisible()
  await expect(page.getByRole('textbox', { name: /title/i }).first()).toBeVisible()

  await page.goto('/admin/collections/events/create')
  await expect(page).toHaveURL(/\/admin\/collections\/events\/create/)
  await expect(page.getByText('Creating new Event')).toBeVisible()
  await expect(page.getByRole('textbox', { name: /title/i }).first()).toBeVisible()

  await page.goto('/admin/collections/posts/create')
  await expect(page).toHaveURL(/\/admin\/collections\/posts\/(create|\d+)/)
  await expect(page.getByText(/Creating new Post|Status:\s*Draft/)).toBeVisible()
  await expect(page.getByRole('textbox', { name: /title/i }).first()).toBeVisible()
}

async function verifyProfileClaimFlow(adminPage: Page, browser: Browser) {
  const email = 'legacy-profile@example.com'
  const password = 'ChangeMe123!'
  const displayName = 'Legacy Profile Claim'
  const handle = 'legacy-profile-claim'

  const [skillsResponse, rolesResponse] = await Promise.all([
    adminPage.request.get('/api/profileSkills', {
      params: {
        limit: '1',
      },
    }),
    adminPage.request.get('/api/profileRoles', {
      params: {
        limit: '1',
      },
    }),
  ])

  expect(skillsResponse.ok()).toBeTruthy()
  expect(rolesResponse.ok()).toBeTruthy()

  const skillsBody = await skillsResponse.json()
  const rolesBody = await rolesResponse.json()
  const skillID = skillsBody.docs[0]?.id
  const roleID = rolesBody.docs[0]?.id

  expect(skillID).toBeTruthy()
  expect(roleID).toBeTruthy()

  const profileResponse = await adminPage.request.post('/api/profiles', {
    data: {
      bio: 'Imported from the legacy CRM and waiting for the owner to claim it.',
      claimEmail: email,
      claimStatus: 'unclaimed',
      displayName,
      handle,
      profileRoles: [roleID],
      profileSkills: [skillID],
      status: 'active',
      visibility: 'public',
    },
  })

  expect(profileResponse.status()).toBe(201)

  const userResponse = await adminPage.request.post('/api/users', {
    data: {
      email,
      name: 'Legacy Profile Owner',
      password,
    },
  })

  expect(userResponse.status()).toBe(201)

  const claimContext = await browser.newContext()
  const claimPage = await claimContext.newPage()

  await claimPage.goto('/login')
  await fillFirst(claimPage.getByLabel(/^email$/i), email)
  await fillFirst(claimPage.getByLabel(/^password$/i), password)
  await claimPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(claimPage).toHaveURL(/\/dashboard/)

  await claimPage.goto('/me')
  await expect(claimPage.getByRole('heading', { name: 'Claim an existing profile' })).toBeVisible()
  await expect(claimPage.getByText(displayName)).toBeVisible()
  await expect(claimPage.getByText(`@${handle}`)).toBeVisible()
  await claimPage.getByRole('button', { name: 'Claim profile' }).click()
  await expect(claimPage.getByText('Profile connected')).toBeVisible()
  await expect(claimPage.getByText(displayName)).toBeVisible()

  await claimContext.close()
}

async function verifyLegacyMemberImport(adminPage: Page) {
  const suffix = Date.now()
  const sourceCRMID = `legacy-${suffix}`
  const displayName = `Legacy Import ${suffix}`
  const handle = `legacy-import-${suffix}`
  const email = `${handle}@example.com`
  const csv = [
    'member_id,name,email,eth_address,primary_class_key,guild_classes,skills,application_skills,introduction,github,twitter,discord,telegram',
    `${sourceCRMID},"${displayName}",${email},0x0000000000000000000000000000000000000000,FRONTEND_DEV,"PROJECT_MANAGEMENT, COMMUNITY","SOLIDITY (SECONDARY), CONTENT (SECONDARY)",UX_RESEARCH,"Imported legacy profile with\nquoted multiline bio.",${handle},@${handle},legacy-discord,legacy-telegram`,
  ].join('\n')

  const dryRunResponse = await adminPage.request.post('/api/profiles/import-legacy?dryRun=true', {
    data: { csv },
  })

  expect(dryRunResponse.ok()).toBeTruthy()
  const dryRunBody = await dryRunResponse.json()
  expect(dryRunBody).toMatchObject({
    created: 1,
    dryRun: true,
    total: 1,
    updated: 0,
  })

  const importResponse = await adminPage.request.post('/api/profiles/import-legacy', {
    data: { csv },
  })

  expect(importResponse.ok()).toBeTruthy()
  const importBody = await importResponse.json()
  expect(importBody).toMatchObject({
    created: 1,
    dryRun: false,
    total: 1,
    updated: 0,
  })

  const profileResponse = await adminPage.request.get('/api/profiles', {
    params: {
      depth: '2',
      limit: '1',
      'where[sourceCRMID][equals]': sourceCRMID,
    },
  })

  expect(profileResponse.ok()).toBeTruthy()
  const profileBody = await profileResponse.json()
  const importedProfile = profileBody.docs[0]

  expect(importedProfile).toMatchObject({
    claimEmail: email,
    claimStatus: 'unclaimed',
    displayName,
    handle,
    sourceCRMID,
    visibility: 'public',
  })
  expect(importedProfile.profileSkills.length).toBeGreaterThan(0)
  expect(importedProfile.profileRoles.length).toBeGreaterThan(0)

  await adminPage.goto('/members')
  await expect(adminPage.getByText(displayName)).toBeVisible()
  await adminPage.goto(`/members/${handle}`)
  await expect(adminPage.getByRole('heading', { name: displayName })).toBeVisible()
}

async function verifyDashboardBrief(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /New Page/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'My Profile' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await expect(page.getByRole('menuitem', { name: 'My profile' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Admin' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible()
  await expect(page.getByText('RaidGuild Cohort')).toBeVisible()
  await expect(page.getByText('Active Now')).toBeVisible()
  await expect(page.getByText('Project Spike Portal', { exact: true })).toBeVisible()
  await expect(page.getByText('Cohort Project Spike Sync').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join next session' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add to calendar' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Active Threads' })).toBeVisible()
  await expect(page.getByText('Defining the project spike object')).toBeVisible()
  await expect(
    page.getByText('Group narrowed the portal around project spikes instead of broad PM tooling.'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ways to Engage' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Next Upcoming Sessions' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View sessions' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recently Active Projects' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View projects' })).toBeVisible()
  await expect(
    page.getByRole('heading', { exact: true, name: 'Cohort Project Spike Portal' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent Public Posts' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cohort Project Spike Portal Update' })).toBeVisible()
}

test('supports onboarding, seeding, and comment moderation', async ({ browser, page }) => {
  await createFirstAdmin(page)
  await seedDatabase(page)
  await verifyDashboardBrief(page)
  await createProfileAndVerifyContributorCreateLinks(page)
  await verifyProfileClaimFlow(page, browser)
  await verifyLegacyMemberImport(page)

  const loginContext = await browser.newContext()
  const loginPage = await loginContext.newPage()
  await verifyPortalLoginRedirect(loginPage)
  await loginContext.close()

  const contributorContext = await browser.newContext()
  const contributorPage = await contributorContext.newPage()
  await verifyContributorAdminCreateAccess(contributorPage)
  await contributorContext.close()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  await verifyPublicHome(publicPage)
  await verifyMemberOnlyProjectVisibility(page, browser, publicPage)
  await verifySeededPosts(publicPage)
  await verifySeededProjectSpike(publicPage)
  await verifySeededSessions(publicPage)
  await verifyPortalSkillEndpoint(publicPage)
  await verifyAgentRegistrationFlow(publicPage)
  await verifyJoinFormEmailErrors(publicPage)
  await submitSponsorInquiry(publicPage, page)
  await publicPage.goto(`/posts/${targetPost.slug}`)
  await expect(publicPage.getByRole('heading', { name: 'Comments' })).toBeVisible()

  await fillFirst(publicPage.getByLabel(/^name$/i), 'Playwright Visitor')
  await fillFirst(publicPage.getByLabel(/email/i), 'visitor@example.com')
  await fillFirst(publicPage.getByLabel(/comment/i), commentText)
  await publicPage.getByRole('button', { name: /submit comment/i }).click()

  await expect(publicPage.getByText(/comment submitted successfully/i)).toBeVisible()
  await expect(publicPage.getByText(commentText)).toHaveCount(0)

  await approveComment(page)

  await expect
    .poll(async () => getApprovedCommentCount(publicPage), {
      timeout: 30000,
    })
    .toBe(1)

  await expect
    .poll(
      async () => {
        await publicPage.reload()
        return publicPage.getByText(commentText).count()
      },
      {
        timeout: 30000,
      },
    )
    .toBe(1)

  if (manualReviewMode) {
    await publicPage.bringToFront()
    await publicPage.pause()
  }

  await publicContext.close()
})
