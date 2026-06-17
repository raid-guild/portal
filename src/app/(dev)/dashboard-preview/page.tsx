import { notFound } from 'next/navigation'
import React from 'react'

import { PortalDashboard } from '../../(frontend)/_components/PortalShell'
import type {
  DailyBrief,
  Event,
  Module,
  PointEvent,
  Post,
  Profile,
  Spotlight,
  User,
  WikiPage,
} from '@/payload-types'

export const dynamic = 'force-dynamic'

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const now = new Date()
  const user = createPreviewUser(now)
  const weekEvents = createPreviewEvents(now)
  const upcomingEvents = weekEvents.slice(0, 3)

  return (
    <PortalDashboard
      activeProfiles={createPreviewProfiles(now)}
      dailyBrief={createPreviewBrief(now, upcomingEvents[0])}
      dailyEngagementSummary={{
        currentStreak: 4,
        hasCheckedInToday: false,
        todayVibe: null,
      }}
      dashboardStats={{
        modules: 6,
        posts: 18,
        sessions: 42,
        wikiPages: 9,
      }}
      featuredModules={createPreviewModules(now)}
      pointEvents={createPreviewPointEvents(now)}
      pointsTotal={85}
      recentPosts={createPreviewPosts(now)}
      recentWikiPages={createPreviewWikiPages(now)}
      spotlights={createPreviewSpotlights(now)}
      upcomingEvents={upcomingEvents}
      user={user}
      weekEvents={weekEvents}
    />
  )
}

const createPreviewUser = (date: Date): User => {
  const timestamp = date.toISOString()

  return {
    collection: 'users',
    createdAt: timestamp,
    email: 'dev-preview@portal.local',
    emailVerifiedAt: timestamp,
    id: 0,
    name: 'Dev Preview',
    roles: ['admin', 'member'],
    updatedAt: timestamp,
  }
}

const createPreviewBrief = (date: Date, nextEvent?: Event): DailyBrief => {
  const timestamp = date.toISOString()

  return {
    _status: 'published',
    briefDate: timestamp,
    briefType: 'weekly',
    createdAt: timestamp,
    focusLabel: 'Cohort season - field experience from the edge',
    id: 1,
    nextEvent,
    sections: [
      {
        body: 'Fireside sessions are producing source material for posts, wiki pages, and follow-up prompts.',
        heading: 'Sessions',
      },
      {
        body: 'The Portal dashboard is shifting from navigation hub to operating brief for members.',
        heading: 'Portal',
      },
      {
        body: 'Wiki generation is moving toward reference-heavy topic pages instead of recap-style articles.',
        heading: 'Knowledge',
      },
    ],
    statusLabel: 'Preview',
    summary:
      'A compact weekly view of sessions, modules, posts, wiki work, and lightweight engagement across the guild.',
    title: 'This Week In The Guild',
    updatedAt: timestamp,
    visibility: 'authenticated',
  }
}

const createPreviewEvents = (date: Date): Event[] => {
  const starts = [1, 2, 4, 6].map((offset, index) => {
    const value = new Date(date)
    value.setDate(date.getDate() + offset)
    value.setHours(10 + index, 30, 0, 0)
    return value
  })

  return starts.map((startsAt, index) => {
    const endsAt = new Date(startsAt)
    endsAt.setHours(startsAt.getHours() + 1)

    return {
      _status: 'published',
      createdAt: date.toISOString(),
      endsAt: endsAt.toISOString(),
      id: index + 1,
      locationLabel: 'Discord / RaidGuild',
      sessionType: index === 0 ? 'fireside' : 'brownbag',
      startsAt: startsAt.toISOString(),
      summary: 'A live working session for members to compare notes and move active work forward.',
      title: ['Fireside: How to RaidGuild', 'Builder Round Table', 'Demo Day', 'Agent Workflows'][
        index
      ],
      updatedAt: date.toISOString(),
      visibility: 'authenticated',
    }
  })
}

const createPreviewModules = (date: Date): Module[] => [
  {
    authMode: 'none',
    createdAt: date.toISOString(),
    enabled: true,
    entryRoute: '/portal-graph',
    featured: true,
    id: 1,
    moduleKind: 'internal',
    name: 'Portal Graph',
    status: 'experimental',
    summary:
      'Explore relationships between profiles, roles, skills, sessions, and emerging Portal records.',
    updatedAt: date.toISOString(),
    visibility: 'authenticated',
  },
]

const createPreviewPosts = (date: Date): Post[] => [
  {
    _status: 'published',
    content: emptyLexical(),
    contentType: 'article',
    createdAt: date.toISOString(),
    id: 1,
    meta: {
      description:
        'A practical update on the Portal as the community workspace and coordination layer.',
    },
    publishedAt: date.toISOString(),
    slug: 'portal-dashboard-preview',
    title: 'Portal Dashboard: Current Work And Next Signals',
    updatedAt: date.toISOString(),
    visibility: 'public',
  },
]

const createPreviewWikiPages = (date: Date): WikiPage[] => [
  {
    _status: 'published',
    body: emptyLexical(),
    confidence: 'medium',
    createdAt: date.toISOString(),
    id: 1,
    reviewStatus: 'reviewed',
    slug: 'agentic-coding-security',
    summary:
      'A source-backed topic page collecting current claims, references, tools, and open questions around agentic coding security.',
    title: 'Agentic Coding Security',
    updatedAt: date.toISOString(),
    visibility: 'authenticated',
  } as WikiPage,
]

const createPreviewProfiles = (date: Date): Profile[] =>
  ['Dekan Bro', 'Queen Raida', 'Sam K', 'Elco', 'Bard Agent', 'Guild Builder'].map(
    (displayName, index) =>
      ({
        bio: 'Building in the Portal this week.',
        claimStatus: 'claimed',
        createdAt: date.toISOString(),
        displayName,
        handle: displayName.toLowerCase().replace(/\s+/g, '-'),
        id: index + 1,
        profileRoles: [],
        profileSkills: [],
        status: 'active',
        updatedAt: date.toISOString(),
        visibility: 'public',
      }) satisfies Profile,
  )

const createPreviewSpotlights = (date: Date): Spotlight[] => [
  {
    _status: 'published',
    createdAt: date.toISOString(),
    id: 1,
    kind: 'featured',
    summary:
      'A cohort thread collecting fireside sessions, field notes, and practical lessons about working inside RaidGuild.',
    targetThread: {
      _status: 'published',
      createdAt: date.toISOString(),
      id: 1,
      slug: 'how-to-raidguild-field-experience',
      summary:
        'A running line of thought around onboarding, sessions, field practice, and durable guild knowledge.',
      threadStatus: 'active',
      title: 'How to RaidGuild - Field Experience From The Edge',
      updatedAt: date.toISOString(),
      visibility: 'authenticated',
    },
    targetType: 'thread',
    title: 'How to RaidGuild - Field Experience From The Edge',
    updatedAt: date.toISOString(),
    visibility: 'authenticated',
  } as Spotlight,
]

const createPreviewPointEvents = (date: Date): PointEvent[] => [
  {
    amount: 10,
    createdAt: date.toISOString(),
    id: 1,
    issuedAt: date.toISOString(),
    reason: 'Hosted a session',
    recipient: 0,
    source: 'system',
    status: 'valid',
    updatedAt: date.toISOString(),
  } as PointEvent,
]

const emptyLexical = () => ({
  root: {
    children: [],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
})
