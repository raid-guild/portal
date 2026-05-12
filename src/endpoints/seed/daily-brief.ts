import type { DailyBrief } from '@/payload-types'

import { headingNode, lexicalRoot, paragraphNode, text } from './lexical'

const authorPlaceholder = '{{AUTHOR}}' as unknown as number

export const dailyBrief: Omit<DailyBrief, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Daily Brief: Portal Signal',
  briefDate: '2026-05-05T12:00:00.000Z',
  briefType: 'daily',
  summary:
    'Today the Portal is focused on turning scattered context into discoverable profiles, project records, and a lightweight dashboard for contributors.',
  sections: [
    {
      heading: 'Builder visibility',
      body: 'Profiles, roles, and skills are becoming the shared vocabulary for discovering who is here and what they can contribute.',
      links: [
        {
          label: 'Review member profiles',
          url: '/members',
        },
      ],
    },
    {
      heading: 'Project surface area',
      body: 'Projects should describe what was built, who contributed, and where to inspect the work. They should not become task management records.',
      links: [
        {
          label: 'View projects',
          url: '/projects',
        },
      ],
    },
    {
      heading: 'Publishing flow',
      body: 'Contributors can draft content through the API, while editors and admins keep review and publishing authority.',
      links: [
        {
          label: 'Read public posts',
          url: '/posts',
        },
      ],
    },
  ],
  content: lexicalRoot([
    headingNode('h2', [text('Portal Signal')]),
    paragraphNode(
      'The daily brief is an authenticated dashboard artifact: short enough to scan, structured enough to automate, and linked back to the people and projects that matter.',
    ),
  ]),
  visibility: 'authenticated',
  sourceNotes:
    'Seeded demo brief. Future versions can be generated from Discord summaries, project updates, publishing activity, and profile changes.',
  authors: [authorPlaceholder],
  _status: 'published',
  publishedAt: '2026-05-05T12:00:00.000Z',
}
