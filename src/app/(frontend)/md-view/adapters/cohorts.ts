import type { Cohort } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import {
  entriesSection,
  escape,
  internalHref,
  keyValueLine,
  linkListSection,
  relationListSection,
  type MarkdownSection,
} from '../lib/markdownPrimitives'
import type { CollectionAdapter } from './types'

const exploringSection = (cohort: Cohort): MarkdownSection => {
  const lines: string[] = []
  if (cohort.thesis) lines.push(escape(cohort.thesis))
  if (cohort.explorationVideoURL) lines.push(`[Exploration video](${cohort.explorationVideoURL})`)

  return { body: lines.join('\n\n'), heading: 'What We Are Exploring' }
}

export const cohortsAdapter: CollectionAdapter<Cohort> = {
  collection: 'cohorts',
  key: 'slug',
  renderDetail: (cohort) => [
    {
      body: keyValueLine([
        ['Status', cohort.programStatus],
        ['Enrollment', cohort.enrollmentStatus],
        ['Cohort', cohort.cohortNumber ? `#${cohort.cohortNumber}` : undefined],
        [
          'Dates',
          cohort.startsAt
            ? `${formatDateTime(cohort.startsAt)}${cohort.endsAt ? ` – ${formatDateTime(cohort.endsAt)}` : ''}`
            : undefined,
        ],
      ]),
    },
    exploringSection(cohort),
    linkListSection(
      'Starter Topics',
      cohort.starterTopics?.map((t) => ({ label: t.title, note: t.summary, url: t.url })),
    ),
    entriesSection('Program Details', cohort.programSections),
    relationListSection(
      'Announcements',
      cohort.featuredPosts?.filter((p) => typeof p === 'object' && p.contentType === 'announcement'),
      (doc) => ({ href: internalHref('posts', doc.slug || doc.id), label: doc.title }),
    ),
    {
      body:
        typeof cohort.highlightedThread === 'object' && cohort.highlightedThread
          ? `[${escape(cohort.highlightedThread.title)}](${internalHref('threads', cohort.highlightedThread.slug || cohort.highlightedThread.id)})`
          : '',
      heading: 'Highlighted Thread',
    },
    relationListSection('Featured Projects', cohort.featuredProjects, (doc) => ({
      href: internalHref('projects', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection(
      'Featured Posts',
      cohort.featuredPosts?.filter((p) => typeof p === 'object' && p.contentType !== 'announcement'),
      (doc) => ({ href: internalHref('posts', doc.slug || doc.id), label: doc.title }),
    ),
    relationListSection('Featured Modules', cohort.featuredModules, (doc) => ({
      href: '/modules',
      label: doc.name,
    })),
    linkListSection(
      'Context Links',
      cohort.contextLinks?.map((l) => ({ label: l.title, note: l.summary, url: l.url })),
    ),
  ],
}
