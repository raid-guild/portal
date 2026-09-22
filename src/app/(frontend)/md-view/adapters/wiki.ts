import type { WikiPage } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { renderLexical } from '../lib/lexicalToMarkdown'
import {
  bulletListSection,
  entriesSection,
  internalHref,
  keyValueLine,
  linkListSection,
  pillListSection,
  relationListSection,
} from '../lib/markdownPrimitives'
import type { CollectionAdapter } from './types'

export const wikiAdapter: CollectionAdapter<WikiPage> = {
  collection: 'wikiPages',
  extraWhere: () => ({ reviewStatus: { equals: 'reviewed' } }),
  key: 'slug',
  renderDetail: (page) => [
    {
      body: keyValueLine([
        ['Review status', page.reviewStatus],
        ['Confidence', page.confidence],
        ['Visibility', page.visibility],
      ]),
    },
    { body: renderLexical(page.body) },
    linkListSection(
      'Key Claims',
      page.keyClaims?.map((c) => ({ label: c.claim, note: c.sourceLabel })),
    ),
    relationListSection('Source Sessions', page.sourceSessions, (event) => ({
      href: internalHref('events', event.id),
      label: event.title,
      meta: formatDateTime(event.startsAt),
    })),
    bulletListSection(
      'Open Questions',
      page.openQuestions?.map((q) => q.question),
    ),
    entriesSection(
      'Prompts',
      page.prompts?.map((p) => ({ body: p.prompt, heading: p.label })),
    ),
    linkListSection('Further Reading', page.furtherReading),
    linkListSection('Papers', page.papers),
    linkListSection('Tools', page.tools),
    pillListSection('Related Topics', page.relatedTopics),
    pillListSection('Possible Topics', page.possibleTopics),
    linkListSection(
      'Source Artifacts',
      page.sourceArtifacts?.map((a) => ({ label: a.label, note: a.sourceType, url: a.url })),
    ),
    relationListSection('Related Posts', page.relatedPosts, (doc) => ({
      href: internalHref('posts', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Related Projects', page.relatedProjects, (doc) => ({
      href: internalHref('projects', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Related Threads', page.relatedThreads, (doc) => ({
      href: internalHref('threads', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Related Profiles', page.relatedProfiles, (doc) => ({
      href: internalHref('members', doc.handle),
      label: doc.displayName,
    })),
    relationListSection('Related Activity', page.relatedActivityItems, (doc) => ({
      label: doc.title,
      meta: doc.activityType,
    })),
  ],
}
