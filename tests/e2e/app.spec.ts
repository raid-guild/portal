import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import crypto from 'crypto'

import {
  adminEmail,
  adminPassword,
  agentRegistrationSecret,
  commentText,
  payloadSecret,
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

function lexicalContent(content: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: content,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
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

async function verifyPublishedPostsArchiveOrdering(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const oldPostTitles = Array.from(
    { length: 13 },
    (_, index) => `Archive backfill ${index} ${suffix}`,
  )
  const latestTitle = `Latest public archive post ${suffix}`

  for (const [index, title] of oldPostTitles.entries()) {
    const response = await adminPage.request.post('/api/posts', {
      data: {
        _status: 'published',
        content: lexicalContent(`Older archive post ${index}.`),
        publishedAt: new Date(Date.UTC(2025, 0, index + 1, 12)).toISOString(),
        slug: `archive-backfill-${index}-${suffix}`,
        title,
      },
    })

    expect(response.status(), `old archive post ${index} should be created`).toBe(201)
  }

  const latestResponse = await adminPage.request.post('/api/posts', {
    data: {
      _status: 'published',
      content: lexicalContent('Newest archive post.'),
      publishedAt: new Date().toISOString(),
      slug: `latest-public-archive-post-${suffix}`,
      title: latestTitle,
    },
  })

  expect(latestResponse.status()).toBe(201)

  await publicPage.goto('/posts')
  await expect(publicPage.getByRole('link', { name: latestTitle })).toBeVisible()
  await expect(publicPage.getByRole('link', { name: oldPostTitles[0] })).toHaveCount(0)
}

async function verifyAdminPostPublishPersists(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const title = `Admin publish persistence ${suffix}`
  const slug = `admin-publish-persistence-${suffix}`

  const createResponse = await adminPage.request.post('/api/posts', {
    data: {
      _status: 'draft',
      content: lexicalContent(
        'This draft should stay published after using the admin publish action.',
      ),
      slug,
      title,
    },
  })

  expect(createResponse.status()).toBe(201)

  const createdPostsResponse = await adminPage.request.get('/api/posts', {
    params: {
      depth: '0',
      limit: '1',
      'where[slug][equals]': slug,
    },
  })

  expect(createdPostsResponse.ok()).toBeTruthy()
  const createdPostsBody = await createdPostsResponse.json()
  const draftPost = createdPostsBody.docs[0]

  expect(draftPost?.id).toBeTruthy()

  await adminPage.goto(`/admin/collections/posts/${draftPost.id}`)
  await expect(adminPage.getByText(/Status:\s*Draft/)).toBeVisible()

  await adminPage.getByRole('button', { name: /publish changes/i }).click()
  await expect(adminPage.getByText(/Status:\s*Published/)).toBeVisible({ timeout: 30000 })

  await adminPage.reload()
  await expect(adminPage.getByText(/Status:\s*Published/)).toBeVisible({ timeout: 30000 })

  const publicApiResponse = await publicPage.request.get('/api/posts', {
    params: {
      depth: '0',
      limit: '1',
      'where[slug][equals]': slug,
      'where[_status][equals]': 'published',
    },
  })

  expect(publicApiResponse.ok()).toBeTruthy()
  const publicApiBody = await publicApiResponse.json()
  expect(publicApiBody.docs).toHaveLength(1)

  await publicPage.goto(`/posts/${slug}`)
  await expect(publicPage.getByRole('heading', { exact: true, name: title })).toBeVisible()
}

async function verifyPublicHome(page: Page) {
  await page.goto('/')
  const header = page.locator('header').first()

  await expect(header.getByRole('link', { name: 'Posts' })).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'A digital coworking space for builders' }),
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
  await page
    .getByRole('article')
    .filter({ hasText: 'Cohort Project Spike Portal' })
    .getByRole('link', { name: 'View project' })
    .click()

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
  const memberOnlyEventTitle = 'Member Only Planning Session'
  const memberOnlyPostTitle = 'Member Only Field Note'
  const memberOnlyPostSlug = 'member-only-field-note'
  const memberEmail = 'project-member@example.com'
  const contributorEmail = 'project-contributor@example.com'
  const agentEmail = 'project-agent@example.com'
  const editorEmail = 'project-editor@example.com'
  const password = 'ChangeMe123!'
  const startsAt = new Date(Date.now() + 36 * 60 * 60 * 1000)

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

  const eventResponse = await adminPage.request.post('/api/events', {
    data: {
      title: memberOnlyEventTitle,
      summary: 'A planning session that should only be visible to users with the member role.',
      startsAt: startsAt.toISOString(),
      endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000).toISOString(),
      sessionType: 'workshop',
      publishedAt: new Date().toISOString(),
      visibility: 'member',
      _status: 'published',
    },
  })

  expect(eventResponse.status()).toBe(201)
  const eventBody = await eventResponse.json()
  const memberOnlyEventID = eventBody.doc?.id || eventBody.id
  expect(memberOnlyEventID).toBeTruthy()

  const postResponse = await adminPage.request.post('/api/posts', {
    data: {
      title: memberOnlyPostTitle,
      slug: memberOnlyPostSlug,
      content: lexicalContent('Member-only post details are visible after member login.'),
      publishedAt: new Date().toISOString(),
      visibility: 'member',
      _status: 'published',
    },
  })

  expect(postResponse.status()).toBe(201)

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

  const agentResponse = await adminPage.request.post('/api/users', {
    data: {
      email: agentEmail,
      name: 'Project Agent',
      password,
      roles: ['agent'],
    },
  })

  expect(agentResponse.status()).toBe(201)

  const editorResponse = await adminPage.request.post('/api/users', {
    data: {
      email: editorEmail,
      name: 'Project Editor',
      password,
      roles: ['editor'],
    },
  })

  expect(editorResponse.status()).toBe(201)

  await publicPage.goto('/projects')
  await expect(publicPage.getByRole('heading', { name: memberOnlyProjectTitle })).toHaveCount(0)
  const publicDetailResponse = await publicPage.goto(`/projects/${memberOnlyProjectSlug}`)
  expect(publicDetailResponse?.status()).toBe(404)
  await publicPage.goto('/events')
  await expect(publicPage.getByText(memberOnlyEventTitle)).toHaveCount(0)
  const publicEventDetailResponse = await publicPage.goto(`/events/${memberOnlyEventID}`)
  expect(publicEventDetailResponse?.status()).toBe(404)
  await publicPage.goto('/posts')
  await expect(publicPage.getByRole('link', { name: memberOnlyPostTitle })).toHaveCount(0)
  const publicPostDetailResponse = await publicPage.goto(`/posts/${memberOnlyPostSlug}`)
  expect(publicPostDetailResponse?.status()).toBe(404)

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
  await contributorPage.goto('/events')
  await expect(contributorPage.getByText(memberOnlyEventTitle)).toHaveCount(0)
  const contributorEventDetailResponse = await contributorPage.goto(`/events/${memberOnlyEventID}`)
  expect(contributorEventDetailResponse?.status()).toBe(404)
  await contributorPage.goto('/posts')
  await expect(contributorPage.getByRole('link', { name: memberOnlyPostTitle })).toHaveCount(0)
  const contributorPostDetailResponse = await contributorPage.goto(`/posts/${memberOnlyPostSlug}`)
  expect(contributorPostDetailResponse?.status()).toBe(404)
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
  await memberPage.goto('/events')
  await expect(memberPage.getByText(memberOnlyEventTitle)).toBeVisible()
  await memberPage.goto(`/events/${memberOnlyEventID}`)
  await expect(memberPage.getByRole('heading', { name: memberOnlyEventTitle })).toBeVisible()
  await memberPage.goto('/posts')
  await expect(memberPage.getByRole('link', { name: memberOnlyPostTitle })).toBeVisible()
  await expect(memberPage.getByRole('link', { name: 'Members' })).toBeVisible()
  await memberPage.goto('/posts?visibility=member')
  await expect(memberPage.getByRole('link', { name: memberOnlyPostTitle })).toBeVisible()
  await memberPage.goto(`/posts/${memberOnlyPostSlug}`)
  await expect(
    memberPage.getByRole('heading', { exact: true, name: memberOnlyPostTitle }),
  ).toBeVisible()
  await expect(memberPage.getByText('Member-only post details')).toBeVisible()
  await memberContext.close()

  const agentContext = await browser.newContext()
  const agentPage = await agentContext.newPage()
  await agentPage.goto('/login')
  await fillFirst(agentPage.getByLabel(/^email$/i), agentEmail)
  await fillFirst(agentPage.getByLabel(/^password$/i), password)
  await agentPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(agentPage).toHaveURL(/\/dashboard/)
  await agentPage.goto('/projects')
  await expect(agentPage.getByRole('heading', { name: memberOnlyProjectTitle })).toBeVisible()
  await agentPage.goto('/events')
  await expect(agentPage.getByText(memberOnlyEventTitle)).toBeVisible()
  await agentPage.goto('/posts?visibility=member')
  await expect(agentPage.getByRole('link', { name: memberOnlyPostTitle })).toBeVisible()

  const agentDraftResponse = await agentPage.request.post('/api/posts', {
    data: {
      title: 'Agent member visibility draft',
      slug: 'agent-member-visibility-draft',
      content: lexicalContent('Agent-authored member visibility draft.'),
      visibility: 'member',
    },
  })

  expect(agentDraftResponse.status()).toBe(201)
  const agentDraftBody = await agentDraftResponse.json()
  expect(agentDraftBody.doc?.visibility || agentDraftBody.visibility).toBe('member')
  expect(agentDraftBody.doc?._status || agentDraftBody._status).toBe('draft')
  await agentContext.close()

  const editorContext = await browser.newContext()
  const editorPage = await editorContext.newPage()
  await editorPage.goto('/login')
  await fillFirst(editorPage.getByLabel(/^email$/i), editorEmail)
  await fillFirst(editorPage.getByLabel(/^password$/i), password)
  await editorPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(editorPage).toHaveURL(/\/dashboard/)

  const editorDraftResponse = await editorPage.request.post('/api/posts', {
    data: {
      title: 'Editor member visibility draft',
      slug: 'editor-member-visibility-draft',
      content: lexicalContent('Editor-authored member visibility draft.'),
      visibility: 'member',
      _status: 'draft',
    },
  })

  expect(editorDraftResponse.status()).toBe(201)
  const editorDraftBody = await editorDraftResponse.json()
  expect(editorDraftBody.doc?.visibility || editorDraftBody.visibility).toBe('member')
  expect(editorDraftBody.doc?._status || editorDraftBody._status).toBe('draft')
  await editorContext.close()
}

async function verifyBadgesFeature(adminPage: Page, browser: Browser, publicPage: Page) {
  const suffix = Date.now()
  const badgeTitle = `E2E Recognition ${suffix}`
  const badgeSlug = `e2e-recognition-${suffix}`
  const memberBadgeTitle = `E2E Member Recognition ${suffix}`
  const privateBadgeTitle = `E2E Private Recognition ${suffix}`
  const awardedNames = [`Badge Holder Alpha ${suffix}`, `Badge Holder Beta ${suffix}`]
  const unbadgedName = `Badge Filter Control ${suffix}`
  const password = 'ChangeMe123!'

  const [rolesResponse, skillsResponse] = await Promise.all([
    adminPage.request.get('/api/profileRoles', {
      params: {
        depth: '0',
        limit: '1',
      },
    }),
    adminPage.request.get('/api/profileSkills', {
      params: {
        depth: '0',
        limit: '1',
      },
    }),
  ])

  expect(rolesResponse.ok()).toBeTruthy()
  expect(skillsResponse.ok()).toBeTruthy()
  const rolesBody = await rolesResponse.json()
  const skillsBody = await skillsResponse.json()
  const roleID = rolesBody.docs?.[0]?.id
  const skillID = skillsBody.docs?.[0]?.id
  expect(roleID).toBeTruthy()
  expect(skillID).toBeTruthy()

  const profileIDs: (number | string)[] = []
  const awardedProfiles: {
    email: string
    handle: string
    id: number | string
    userID: number | string
  }[] = []

  for (const displayName of [...awardedNames, unbadgedName]) {
    const handle = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const email = `${handle}@example.com`
    const userResponse = await adminPage.request.post('/api/users', {
      data: {
        email,
        name: displayName,
        password,
        roles: ['member'],
      },
    })

    expect(userResponse.status()).toBe(201)
    const userBody = await userResponse.json()
    const userID = userBody.doc?.id || userBody.id
    expect(userID).toBeTruthy()

    const profileResponse = await adminPage.request.post('/api/profiles', {
      data: {
        bio: 'A profile used to verify badge display and badge filtering.',
        displayName,
        handle,
        profileRoles: [roleID],
        profileSkills: [skillID],
        status: 'active',
        user: userID,
        visibility: 'public',
      },
    })

    expect(profileResponse.status()).toBe(201)
    const profileBody = await profileResponse.json()
    const profileID = profileBody.doc?.id || profileBody.id
    expect(profileID).toBeTruthy()

    if (displayName !== unbadgedName) {
      profileIDs.push(profileID)
      awardedProfiles.push({
        email,
        handle,
        id: profileID,
        userID,
      })
    }
  }

  const badgeResponse = await adminPage.request.post('/api/badges', {
    data: {
      title: badgeTitle,
      slug: badgeSlug,
      description: 'A deterministic badge for e2e recognition checks.',
      category: 'contribution',
      fallbackIcon: 'spark',
      displayStyle: 'featured',
      sortOrder: 5,
      visibility: 'public',
    },
  })

  expect(badgeResponse.status()).toBe(201)
  const badgeBody = await badgeResponse.json()
  const badgeID = badgeBody.doc?.id || badgeBody.id
  expect(badgeID).toBeTruthy()

  const memberBadgeResponse = await adminPage.request.post('/api/badges', {
    data: {
      title: memberBadgeTitle,
      slug: `e2e-member-recognition-${suffix}`,
      description: 'A deterministic member-visible badge for e2e recognition checks.',
      category: 'community',
      fallbackIcon: 'shield',
      displayStyle: 'standard',
      sortOrder: 6,
      visibility: 'public',
    },
  })

  expect(memberBadgeResponse.status()).toBe(201)
  const memberBadgeBody = await memberBadgeResponse.json()
  const memberBadgeID = memberBadgeBody.doc?.id || memberBadgeBody.id
  expect(memberBadgeID).toBeTruthy()

  const privateBadgeResponse = await adminPage.request.post('/api/badges', {
    data: {
      title: privateBadgeTitle,
      slug: `e2e-private-recognition-${suffix}`,
      description: 'A deterministic private badge for e2e recognition checks.',
      category: 'community',
      fallbackIcon: 'shield',
      displayStyle: 'standard',
      sortOrder: 7,
      visibility: 'public',
    },
  })

  expect(privateBadgeResponse.status()).toBe(201)
  const privateBadgeBody = await privateBadgeResponse.json()
  const privateBadgeID = privateBadgeBody.doc?.id || privateBadgeBody.id
  expect(privateBadgeID).toBeTruthy()

  const agentResponse = await adminPage.request.post('/api/users', {
    data: {
      email: `badge-agent-${suffix}@example.com`,
      name: `Badge Agent ${suffix}`,
      password,
      roles: ['agent'],
    },
  })

  expect(agentResponse.status()).toBe(201)
  const agentBody = await agentResponse.json()
  const agentID = agentBody.doc?.id || agentBody.id
  expect(agentID).toBeTruthy()

  const agentContext = await browser.newContext()
  const agentPage = await agentContext.newPage()
  await agentPage.goto('/login')
  await fillFirst(agentPage.getByLabel(/^email$/i), `badge-agent-${suffix}@example.com`)
  await fillFirst(agentPage.getByLabel(/^password$/i), password)
  await agentPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(agentPage).toHaveURL(/\/dashboard/)

  const awardResponse = await agentPage.request.post('/api/profileBadges', {
    data: {
      awardedByUser: awardedProfiles[1].userID,
      badge: badgeID,
      featured: true,
      note: 'Agent-issued batch badge award.',
      profiles: profileIDs,
      source: 'admin',
      visibility: 'public',
    },
  })

  expect(awardResponse.status()).toBe(201)
  const awardBody = await awardResponse.json()
  const awardedByUser = awardBody.doc?.awardedByUser || awardBody.awardedByUser
  const awardedByUserID =
    awardedByUser && typeof awardedByUser === 'object' ? awardedByUser.id : awardedByUser
  expect(awardBody.doc?.source || awardBody.source).toBe('agent')
  expect(String(awardedByUserID)).toBe(String(agentID))
  expect(awardBody.doc?.profiles || awardBody.profiles).toHaveLength(2)

  const memberAwardResponse = await agentPage.request.post('/api/profileBadges', {
    data: {
      badge: memberBadgeID,
      note: 'Agent-issued member-visible badge award.',
      profiles: [awardedProfiles[0].id],
      source: 'admin',
      visibility: 'member',
    },
  })

  expect(memberAwardResponse.status()).toBe(201)
  const memberAwardBody = await memberAwardResponse.json()
  expect(memberAwardBody.doc?.source || memberAwardBody.source).toBe('agent')

  const privateAwardResponse = await agentPage.request.post('/api/profileBadges', {
    data: {
      badge: privateBadgeID,
      note: 'Agent-issued private badge award.',
      profiles: [awardedProfiles[0].id],
      source: 'admin',
      visibility: 'private',
    },
  })

  expect(privateAwardResponse.status()).toBe(201)
  const privateAwardBody = await privateAwardResponse.json()
  expect(privateAwardBody.doc?.source || privateAwardBody.source).toBe('agent')
  await agentContext.close()

  await publicPage.goto('/badges')
  await expect(publicPage.getByRole('heading', { name: 'Badges' })).toBeVisible()
  await expect(publicPage.getByRole('heading', { name: badgeTitle })).toBeVisible()
  await expect(publicPage.getByText('2 members have received this badge')).toBeVisible()

  await adminPage.goto('/members')
  await expect(adminPage.getByRole('link', { name: 'Browse badges' })).toHaveAttribute(
    'href',
    '/badges',
  )
  await adminPage.getByLabel('Badge').selectOption({ label: badgeTitle })
  await expect(adminPage.getByRole('link', { name: awardedNames[0] })).toBeVisible()
  await expect(adminPage.getByRole('link', { name: awardedNames[1] })).toBeVisible()
  await expect(adminPage.getByRole('link', { name: unbadgedName })).toHaveCount(0)

  await publicPage.goto(`/members/${awardedProfiles[0].handle}`)
  await expect(publicPage.getByRole('heading', { name: awardedNames[0] })).toBeVisible()
  await expect(publicPage.getByRole('heading', { name: 'Badges' })).toBeVisible()
  await expect(publicPage.getByText(badgeTitle)).toBeVisible()
  await expect(publicPage.getByText(memberBadgeTitle)).toHaveCount(0)
  await expect(publicPage.getByText(privateBadgeTitle)).toHaveCount(0)

  const memberContext = await browser.newContext()
  const memberPage = await memberContext.newPage()
  await memberPage.goto('/login')
  await fillFirst(memberPage.getByLabel(/^email$/i), awardedProfiles[0].email)
  await fillFirst(memberPage.getByLabel(/^password$/i), password)
  await memberPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(memberPage).toHaveURL(/\/dashboard/)
  await memberPage.goto(`/members/${awardedProfiles[0].handle}`)
  await expect(memberPage.getByText(badgeTitle)).toBeVisible()
  await expect(memberPage.getByText(memberBadgeTitle)).toBeVisible()
  await expect(memberPage.getByText(privateBadgeTitle)).toHaveCount(0)
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
  await expect(
    page
      .getByRole('article')
      .filter({ hasText: 'Cohort Project Spike Sync' })
      .getByRole('link', { name: 'Add to calendar' }),
  ).toBeVisible()
}

async function verifySessionDetailVisibility(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const pastEnd = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const publishedAt = new Date().toISOString()
  const publicTitle = `Public Fireside Detail ${suffix}`
  const authenticatedTitle = `Authenticated Fireside Detail ${suffix}`
  const failedDiscordTitle = `Failed Discord Detail ${suffix}`

  const publicResponse = await adminPage.request.post('/api/events', {
    data: {
      title: publicTitle,
      summary: 'A public session with member-visible source material.',
      startsAt: pastStart,
      endsAt: pastEnd,
      sessionType: 'fireside',
      sourceArtifactURL: 'https://example.com/source-artifact',
      sourceStatus: 'processed',
      visibility: 'public',
      _status: 'published',
      publishedAt,
    },
  })
  expect(publicResponse.status()).toBe(201)
  const publicEventBody = await publicResponse.json()
  const publicEventID = publicEventBody.doc?.id || publicEventBody.id
  expect(publicEventID).toBeTruthy()

  const authenticatedResponse = await adminPage.request.post('/api/events', {
    data: {
      title: authenticatedTitle,
      summary: 'An authenticated session hidden from anonymous visitors.',
      startsAt: pastStart,
      endsAt: pastEnd,
      sessionType: 'fireside',
      sourceArtifactURL: 'https://example.com/authenticated-source-artifact',
      sourceStatus: 'processed',
      visibility: 'authenticated',
      _status: 'published',
      publishedAt,
    },
  })
  expect(authenticatedResponse.status()).toBe(201)
  const authenticatedEventBody = await authenticatedResponse.json()
  const authenticatedEventID = authenticatedEventBody.doc?.id || authenticatedEventBody.id
  expect(authenticatedEventID).toBeTruthy()

  const failedDiscordResponse = await adminPage.request.post('/api/events', {
    data: {
      title: failedDiscordTitle,
      summary: 'A public session whose Discord sync failed during creation.',
      startsAt: pastStart,
      endsAt: pastEnd,
      discordSyncError: JSON.stringify({ code: 50035, message: 'Invalid Form Body' }),
      discordSyncStatus: 'failed',
      sessionType: 'workshop',
      visibility: 'public',
      _status: 'published',
      publishedAt,
    },
  })
  expect(failedDiscordResponse.status()).toBe(201)
  const failedDiscordEventBody = await failedDiscordResponse.json()
  const failedDiscordEventID = failedDiscordEventBody.doc?.id || failedDiscordEventBody.id
  expect(failedDiscordEventID).toBeTruthy()

  await publicPage.goto(`/events/${publicEventID}`)
  await expect(publicPage.getByRole('heading', { name: publicTitle })).toBeVisible()
  await expect(publicPage.getByRole('heading', { name: 'Session Notes' })).toBeVisible()
  await expect(publicPage.getByText('Continue In The Portal')).toBeVisible()
  await expect(publicPage.getByRole('heading', { name: 'Source Material' })).toHaveCount(0)

  const anonymousAuthenticatedResponse = await publicPage.goto(`/events/${authenticatedEventID}`)
  expect(anonymousAuthenticatedResponse?.status()).toBe(404)
  await expect(publicPage.getByRole('heading', { name: authenticatedTitle })).toHaveCount(0)

  await adminPage.goto(`/events/${publicEventID}`)
  await expect(adminPage.getByRole('heading', { name: publicTitle })).toBeVisible()
  await expect(adminPage.getByRole('heading', { name: 'Session Notes' })).toBeVisible()
  await expect(adminPage.getByRole('heading', { name: 'Source Material' })).toBeVisible()
  await expect(adminPage.getByRole('link', { name: 'Source artifact' })).toBeVisible()
  await expect(adminPage.getByRole('heading', { name: 'Derived Posts' })).toBeVisible()
  await expect(adminPage.getByText('No published posts have been derived')).toBeVisible()
  await expect(adminPage.getByRole('heading', { name: 'Related Context' })).toBeVisible()
  await expect(adminPage.getByText('No related projects or threads')).toBeVisible()

  await adminPage.goto(`/events/${authenticatedEventID}`)
  await expect(adminPage.getByRole('heading', { name: authenticatedTitle })).toBeVisible()
  await expect(adminPage.getByRole('heading', { name: 'Source Material' })).toBeVisible()

  await publicPage.goto(`/events/${failedDiscordEventID}`)
  await expect(publicPage.getByRole('heading', { name: failedDiscordTitle })).toBeVisible()
  await expect(publicPage.getByText('Discord Sync Failed', { exact: true })).toHaveCount(0)

  await adminPage.goto(`/events/${failedDiscordEventID}`)
  await expect(adminPage.getByRole('heading', { name: failedDiscordTitle })).toBeVisible()
  await expect(adminPage.getByText('Discord Sync Failed', { exact: true })).toBeVisible()
  await expect(adminPage.getByText('Invalid Form Body (50035)')).toBeVisible()
}

async function verifySessionTypeCreation(page: Page) {
  const sessionTypes = ['brownbag', 'workshop', 'all-hands', 'demo', 'pitch', 'fireside']
  const suffix = Date.now()
  const profileResponse = await page.request.get('/api/profiles?limit=1')
  expect(profileResponse.ok()).toBeTruthy()
  const profileBody = await profileResponse.json()
  const legacySpeakerID = profileBody.docs?.[0]?.id
  expect(legacySpeakerID).toBeTruthy()

  for (const [index, sessionType] of sessionTypes.entries()) {
    const startsAt = new Date(Date.now() + (index + 2) * 60 * 60 * 1000).toISOString()
    const response = await page.request.post('/api/events/create', {
      data: {
        durationMinutes: 30,
        sessionType,
        startsAt,
        summary: `Regression coverage for ${sessionType} session creation.`,
        syncDiscord: false,
        title: `Playwright ${sessionType} session ${suffix}`,
        visibility: 'public',
      },
    })

    expect(response.ok(), `${sessionType} session creation should succeed`).toBeTruthy()

    const cmsStartsAt = new Date(Date.now() + (index + 10) * 60 * 60 * 1000)
    const cmsResponse = await page.request.post('/api/events', {
      data: {
        _status: 'published',
        endsAt: new Date(cmsStartsAt.getTime() + 30 * 60 * 1000).toISOString(),
        publishedAt: new Date().toISOString(),
        sessionType,
        startsAt: cmsStartsAt.toISOString(),
        summary: `CMS API regression coverage for ${sessionType} session creation.`,
        title: `Playwright CMS ${sessionType} session ${suffix}`,
        visibility: 'public',
      },
    })

    expect(cmsResponse.ok(), `${sessionType} CMS event creation should succeed`).toBeTruthy()
  }

  const recurringStartsAt = new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
  const recurringResponse = await page.request.post('/api/events/create', {
    data: {
      durationMinutes: 60,
      recurrenceCadence: 'weekly',
      recurrenceUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      seriesKey: `playwright-weekly-${suffix}`,
      seriesTitle: 'Playwright Weekly Series',
      sessionType: 'workshop',
      startsAt: recurringStartsAt,
      summary: 'Regression coverage for recurring session metadata.',
      syncDiscord: false,
      title: `Playwright recurring session ${suffix}`,
      visibility: 'public',
    },
  })

  expect(recurringResponse.ok(), 'recurring session creation should succeed').toBeTruthy()
  const recurringBody = await recurringResponse.json()
  const recurringEvent = recurringBody.event
  expect(recurringEvent.seriesKey).toBe(`playwright-weekly-${suffix}`)
  expect(recurringEvent.seriesTitle).toBe('Playwright Weekly Series')
  expect(recurringEvent.recurrenceCadence).toBe('weekly')

  const legacySpeakerStartsAt = new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString()
  const legacySpeakerResponse = await page.request.post('/api/events/create', {
    data: {
      durationMinutes: 30,
      sessionType: 'brownbag',
      speaker: legacySpeakerID,
      startsAt: legacySpeakerStartsAt,
      summary: 'Regression coverage for legacy speaker profile linkage.',
      syncDiscord: false,
      title: `Playwright legacy speaker session ${suffix}`,
      visibility: 'public',
    },
  })
  expect(legacySpeakerResponse.ok(), 'legacy speaker session creation should succeed').toBeTruthy()
  const legacySpeakerBody = await legacySpeakerResponse.json()
  const relatedProfileIDs = (legacySpeakerBody.event.relatedProfiles || []).map(
    (profile: number | { id: number }) => (typeof profile === 'number' ? profile : profile.id),
  )
  expect(relatedProfileIDs).toContain(legacySpeakerID)

  await page.goto('/events')
  await expect(page.getByText('Playwright Weekly Series / Weekly')).toBeVisible()
}

async function verifyLiveSessionHighlight(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const startsAt = new Date(Date.now() - 5 * 60 * 1000)
  const title = `Playwright Live Session ${suffix}`
  const response = await adminPage.request.post('/api/events', {
    data: {
      _status: 'published',
      endsAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      publishedAt: new Date().toISOString(),
      sessionType: 'demo',
      startsAt: startsAt.toISOString(),
      summary: 'Regression coverage for the live session section.',
      title,
      visibility: 'public',
    },
  })

  expect(response.status()).toBe(201)

  await publicPage.goto('/events')
  await expect(
    publicPage.locator('section').filter({ hasText: title }).locator('.portal-kicker', {
      hasText: 'Live Now',
    }),
  ).toBeVisible()
  await expect(publicPage.getByRole('article').filter({ hasText: title })).toBeVisible()
  await expect(
    publicPage.getByRole('article').filter({ hasText: title }).getByText('Live now'),
  ).toBeVisible()
}

async function verifyEventArtifactIngest(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const title = `Playwright Artifact Event ${suffix}`
  const discordScheduledEventID = `discord-event-${suffix}`
  const startsAt = new Date(Date.now() + 20 * 60 * 60 * 1000)
  const response = await adminPage.request.post('/api/events', {
    data: {
      _status: 'published',
      discordScheduledEventID,
      endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000).toISOString(),
      publishedAt: new Date().toISOString(),
      sessionType: 'workshop',
      startsAt: startsAt.toISOString(),
      title,
      visibility: 'public',
    },
  })

  expect(response.status()).toBe(201)

  const unauthorizedResponse = await publicPage.request.post('/api/events/artifacts/ingest', {
    data: {
      discord: {
        scheduledEventID: discordScheduledEventID,
      },
    },
  })

  expect(unauthorizedResponse.status()).toBe(401)

  const ingestResponse = await adminPage.request.post('/api/events/artifacts/ingest', {
    data: {
      artifacts: {
        artifactID: `artifact-${suffix}`,
        recordingURL: 'https://example.com/recording',
        summaryURL: 'https://example.com/summary',
        transcriptURL: 'https://example.com/transcript',
      },
      discord: {
        scheduledEventID: discordScheduledEventID,
      },
    },
  })

  expect(ingestResponse.ok()).toBeTruthy()
  const ingestBody = await ingestResponse.json()
  expect(ingestBody.matchedBy).toBe('discordScheduledEventID')
  expect(ingestBody.event).toMatchObject({
    recordingURL: 'https://example.com/recording',
    sourceArtifactID: `artifact-${suffix}`,
    sourceArtifactURL: 'https://example.com/summary',
    sourceStatus: 'summarized',
    summaryArtifactURL: 'https://example.com/summary',
    transcriptArtifactURL: 'https://example.com/transcript',
  })
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
  await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
  await fillFirst(page.getByLabel(/^email$/i), adminEmail)
  await fillFirst(page.getByLabel(/^password$/i), adminPassword)
  await page.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('RaidGuild Cohort')).toBeVisible()
}

async function verifyPasswordResetPages(browser: Browser) {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('/forgot-password')
  await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()

  await page.goto('/reset-password')
  await expect(page.getByRole('heading', { name: /choose a new password/i })).toBeVisible()
  await expect(page.getByText(/reset token is missing/i)).toBeVisible()

  await context.close()
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
  const createdUser = await createResponse.json()
  const createdUserID = createdUser.doc?.id || createdUser.id
  expect(createdUserID).toBeTruthy()
  expect(createdUser.doc?.roles || createdUser.roles).toContain('unverified')

  await page.goto('/login')
  await fillFirst(page.getByLabel(/^email$/i), email)
  await fillFirst(page.getByLabel(/^password$/i), password)
  await page.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/projects')
  await expect(page.getByRole('link', { name: 'Create project' })).toHaveCount(0)

  await page.goto('/me')
  await expect(page.getByRole('heading', { name: 'Profile wizard' })).toBeVisible()
  await expect(page.getByText('Email not verified')).toBeVisible()

  const emailVerificationToken = signAccountEmailVerificationToken({
    email,
    exp: Date.now() + 1000 * 60 * 30,
    purpose: 'account-email',
    userID: String(createdUserID),
  })
  await page.goto(`/me?verifyEmailToken=${encodeURIComponent(emailVerificationToken)}`)
  await expect(page.getByText('Email verified', { exact: true })).toBeVisible()

  const verifiedUserResponse = await page.request.get(`/api/users/${createdUserID}`)
  expect(verifiedUserResponse.ok()).toBeTruthy()
  const verifiedUser = await verifiedUserResponse.json()
  expect(verifiedUser.roles).toContain('contributor')
  expect(verifiedUser.roles).not.toContain('unverified')

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
  await expect(page).toHaveURL(/\/events\/new/)
  await expect(page.getByRole('heading', { name: 'Create session' })).toBeVisible()

  await page.goto('/posts')
  await page.getByRole('link', { name: 'Create post' }).click()
  await expect(page).toHaveURL(/\/admin\/collections\/posts\/(create|\d+)/)
  await expect(page.getByText(/Creating new Post|Status:\s*Draft/)).toBeVisible()
}

async function createProfileAndVerifyContributorCreateLinks(page: Page) {
  const profileHandle = `playwright-admin-${Date.now()}`

  await page.goto('/me')
  await expect(page.getByRole('heading', { name: 'Profile wizard' })).toBeVisible()
  await fillFirst(page.getByLabel(/^display name$/i), 'Playwright Admin')
  await fillFirst(page.getByLabel(/^handle$/i), profileHandle)
  await fillFirst(
    page.getByLabel(/^bio$/i),
    'Testing member-facing profile creation and public directory display.',
  )
  await fillFirst(page.getByLabel(/^location$/i), 'Denver')
  await page.getByRole('button', { name: /next/i }).click()

  await page.getByLabel(/^Warrior$/i).check()
  await page.getByRole('button', { name: /next/i }).click()

  await page.getByLabel(/^Frontend Dev$/i).check()
  await page.getByRole('button', { name: /next/i }).click()

  await fillFirst(page.getByLabel(/^website$/i), 'https://example.com')
  await fillFirst(page.getByLabel(/^x$/i), 'playwright')
  await page.getByRole('button', { name: /save profile/i }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()

  await page.goto('/members')
  await expect(page.getByRole('link', { name: 'Playwright Admin' })).toBeVisible()
  await expect(page.getByText(`@${profileHandle}`)).toBeVisible()
  await page.getByRole('link', { name: 'Playwright Admin' }).click()
  await expect(page).toHaveURL(new RegExp(`/members/${profileHandle}/?$`))
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
    '/events/new',
  )
  await page.getByRole('link', { name: 'Create session' }).click()
  await expect(page).toHaveURL(/\/events\/new/)
  const sessionTitle = `Playwright Brownbag ${Date.now()}`
  await fillFirst(page.getByLabel(/^title$/i), sessionTitle)
  await page.getByRole('button', { name: /^create session$/i }).click()
  await expect(page).toHaveURL(/\/events/)
  await expect(page.getByText(sessionTitle)).toBeVisible()

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
  const profileBody = await profileResponse.json()
  const profileID = profileBody.doc?.id || profileBody.id
  expect(profileID).toBeTruthy()

  const userResponse = await adminPage.request.post('/api/users', {
    data: {
      email,
      name: 'Legacy Profile Owner',
      password,
    },
  })

  expect(userResponse.status()).toBe(201)
  const createdUser = await userResponse.json()
  const createdUserID = createdUser.doc?.id || createdUser.id
  expect(createdUserID).toBeTruthy()

  const claimContext = await browser.newContext()
  const claimPage = await claimContext.newPage()

  await claimPage.goto('/login')
  await fillFirst(claimPage.getByLabel(/^email$/i), email)
  await fillFirst(claimPage.getByLabel(/^password$/i), password)
  await claimPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(claimPage).toHaveURL(/\/dashboard/)

  await claimPage.goto(`/members/${handle}`)
  await expect(claimPage.getByRole('heading', { name: displayName })).toBeVisible()
  await expect(claimPage.getByRole('heading', { name: 'Is this you?' })).toBeVisible()
  await claimPage.getByRole('button', { name: 'Email claim link' }).click()
  await expect(claimPage.getByText('Verification email sent.')).toBeVisible()

  await claimPage.goto('/me')
  await expect(claimPage.getByRole('heading', { name: 'Claim an existing profile' })).toBeVisible()
  await expect(claimPage.getByText(displayName)).toBeVisible()
  await expect(claimPage.getByText(`@${handle}`)).toBeVisible()

  const unverifiedClaimResponse = await claimPage.request.post('/api/profiles/claim', {
    data: { profileID },
  })
  expect(unverifiedClaimResponse.status()).toBe(403)

  const claimToken = signProfileClaimToken({
    email,
    exp: Date.now() + 1000 * 60 * 30,
    profileID: String(profileID),
    userID: String(createdUserID),
  })
  const claimPath = `/me?claimProfile=${encodeURIComponent(
    String(profileID),
  )}&claimToken=${encodeURIComponent(claimToken)}`

  await claimContext.clearCookies()
  await claimPage.goto(claimPath)
  await expect(claimPage).toHaveURL(/\/login\?next=/)
  await fillFirst(claimPage.getByLabel(/^email$/i), email)
  await fillFirst(claimPage.getByLabel(/^password$/i), password)
  await claimPage.getByRole('button', { name: /log in to the brief/i }).click()
  await expect(claimPage.getByText('Profile connected')).toBeVisible()
  await expect(claimPage.getByText(displayName)).toBeVisible()
  await expect(claimPage.getByText('Email verified', { exact: true })).toBeVisible()

  const claimedUserResponse = await adminPage.request.get(`/api/users/${createdUserID}`)
  expect(claimedUserResponse.ok()).toBeTruthy()
  const claimedUser = await claimedUserResponse.json()
  expect(claimedUser.roles).toContain('contributor')
  expect(claimedUser.roles).toContain('member')
  expect(claimedUser.roles).not.toContain('unverified')
  expect(claimedUser.emailVerifiedAt).toBeTruthy()

  await claimContext.close()
}

function signProfileClaimToken(payload: {
  email: string
  exp: number
  profileID: string
  userID: string
}) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', payloadSecret)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

function signAccountEmailVerificationToken(payload: {
  email: string
  exp: number
  purpose: 'account-email'
  userID: string
}) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', payloadSecret)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

async function verifyLegacyMemberImport(adminPage: Page) {
  const suffix = Date.now()
  const sourceCRMID = `legacy-${suffix}`
  const displayName = `Legacy Import ${suffix}`
  const handle = `legacy${suffix.toString(36).slice(-6)}`
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
    contact: {
      x: handle,
    },
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

async function verifyAnonymousPublicMemberProfile(adminPage: Page, publicPage: Page) {
  const suffix = Date.now()
  const displayName = `Public Profile ${suffix}`
  const handle = `public-profile-${suffix}`
  const privatePostTitle = `Private profile post ${suffix}`
  const publicEventTitle = `Public profile session ${suffix}`
  const publicPostTitle = `Public profile post ${suffix}`
  const publicProjectTitle = `Public profile project ${suffix}`
  const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const userResponse = await adminPage.request.post('/api/users', {
    data: {
      email: `public-profile-${suffix}@example.com`,
      name: displayName,
      password: 'ChangeMe123!',
      roles: ['member'],
    },
  })

  expect(userResponse.status()).toBe(201)
  const userBody = await userResponse.json()
  const userID = userBody.doc?.id || userBody.id
  const [rolesResponse, skillsResponse] = await Promise.all([
    adminPage.request.get('/api/profileRoles', {
      params: {
        depth: '0',
        limit: '1',
      },
    }),
    adminPage.request.get('/api/profileSkills', {
      params: {
        depth: '0',
        limit: '1',
      },
    }),
  ])

  expect(rolesResponse.ok()).toBeTruthy()
  expect(skillsResponse.ok()).toBeTruthy()
  const rolesBody = await rolesResponse.json()
  const skillsBody = await skillsResponse.json()
  const roleID = rolesBody.docs?.[0]?.id
  const skillID = skillsBody.docs?.[0]?.id
  expect(roleID).toBeTruthy()
  expect(skillID).toBeTruthy()

  const profileResponse = await adminPage.request.post('/api/profiles', {
    data: {
      bio: 'A public profile that anonymous visitors should be able to view.',
      displayName,
      handle,
      profileRoles: [roleID],
      profileSkills: [skillID],
      status: 'active',
      user: userID,
      visibility: 'public',
    },
  })

  expect(profileResponse.status()).toBe(201)
  const profileBody = await profileResponse.json()
  const profileID = profileBody.doc?.id || profileBody.id

  const projectResponse = await adminPage.request.post('/api/projects', {
    data: {
      title: publicProjectTitle,
      summary: 'Public project associated with a member profile.',
      contributors: [profileID],
      currentState: [{ body: 'Visible on the anonymous profile page.' }],
      lastActiveAt: new Date().toISOString(),
      projectStatus: 'active',
      publishedAt: new Date().toISOString(),
      slug: `public-profile-project-${suffix}`,
      visibility: 'public',
      _status: 'published',
    },
  })

  expect(projectResponse.status()).toBe(201)

  const eventResponse = await adminPage.request.post('/api/events', {
    data: {
      title: publicEventTitle,
      summary: 'Public session associated with a member profile.',
      startsAt: startsAt.toISOString(),
      endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000).toISOString(),
      relatedProfiles: [profileID],
      sessionType: 'demo',
      publishedAt: new Date().toISOString(),
      visibility: 'public',
      _status: 'published',
    },
  })

  expect(eventResponse.status()).toBe(201)

  const publicPostResponse = await adminPage.request.post('/api/posts', {
    data: {
      title: publicPostTitle,
      slug: `public-profile-post-${suffix}`,
      authors: [userID],
      content: lexicalContent('Public post associated with a member profile.'),
      publishedAt: new Date().toISOString(),
      visibility: 'public',
      _status: 'published',
    },
  })

  expect(publicPostResponse.status()).toBe(201)

  const privatePostResponse = await adminPage.request.post('/api/posts', {
    data: {
      title: privatePostTitle,
      slug: `private-profile-post-${suffix}`,
      authors: [userID],
      content: lexicalContent('Member-only post associated with a member profile.'),
      publishedAt: new Date().toISOString(),
      visibility: 'member',
      _status: 'published',
    },
  })

  expect(privatePostResponse.status()).toBe(201)

  const response = await publicPage.goto(`/members/${handle}`)
  expect(response?.ok()).toBeTruthy()
  await expect(publicPage.getByRole('heading', { name: displayName })).toBeVisible()
  await expect(publicPage.getByText(publicProjectTitle)).toBeVisible()
  await expect(publicPage.getByText(publicEventTitle)).toBeVisible()
  await expect(publicPage.getByText(publicPostTitle)).toBeVisible()
  await expect(publicPage.getByText(privatePostTitle)).toHaveCount(0)
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

async function verifyDailyVibeCheck(page: Page) {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Guild Points' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vibe check' })).toBeVisible()

  await page.getByRole('button', { name: 'Vibe check' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /Learning/i }).click()
  await page.getByPlaceholder('What did you notice today?').fill('E2E vibe note for point award.')
  await page.getByRole('button', { name: /Check in \+5/i }).click()

  await expect(page.getByRole('button', { name: 'Vibe checked' })).toBeVisible()
  await expect(page.getByText('Current streak: 1 day')).toBeVisible()
  await expect(page.getByText('+5')).toBeVisible()
  await expect(page.getByText('Daily vibe check')).toBeVisible()

  const duplicateResponse = await page.request.post('/api/daily-engagements/check-in', {
    data: {
      vibe: 'raiding',
    },
  })
  expect(duplicateResponse.ok()).toBeTruthy()
  const duplicateBody = await duplicateResponse.json()
  expect(duplicateBody).toMatchObject({
    alreadyCheckedIn: true,
    pointsAwarded: 0,
  })

  const pointEventsResponse = await page.request.get('/api/pointEvents', {
    params: {
      depth: '0',
      limit: '10',
      'where[reason][equals]': 'Daily vibe check',
      'where[status][equals]': 'valid',
    },
  })
  expect(pointEventsResponse.ok()).toBeTruthy()
  const pointEventsBody = await pointEventsResponse.json()
  expect(pointEventsBody.docs).toHaveLength(1)
  expect(pointEventsBody.docs[0]).toMatchObject({
    amount: 5,
    reason: 'Daily vibe check',
    source: 'system',
    status: 'valid',
  })
}

test('supports onboarding, seeding, and comment moderation', async ({ browser, page }) => {
  await createFirstAdmin(page)
  await seedDatabase(page)
  await verifyDashboardBrief(page)
  await verifyDailyVibeCheck(page)
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
  await verifyAnonymousPublicMemberProfile(page, publicPage)
  await verifyMemberOnlyProjectVisibility(page, browser, publicPage)
  await verifyBadgesFeature(page, browser, publicPage)
  await verifyPublishedPostsArchiveOrdering(page, publicPage)
  await verifyAdminPostPublishPersists(page, publicPage)
  await verifySeededPosts(publicPage)
  await verifySeededProjectSpike(publicPage)
  await verifySeededSessions(publicPage)
  await verifySessionDetailVisibility(page, publicPage)
  await verifySessionTypeCreation(page)
  await verifyLiveSessionHighlight(page, publicPage)
  await verifyEventArtifactIngest(page, publicPage)
  await verifyPortalSkillEndpoint(publicPage)
  await verifyAgentRegistrationFlow(publicPage)
  await verifyPasswordResetPages(browser)
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
