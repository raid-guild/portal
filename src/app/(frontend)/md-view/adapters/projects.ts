import type { Project } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { renderLexical } from '../lib/lexicalToMarkdown'
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

const projectStateSection = (project: Project): MarkdownSection => {
  const lines: string[] = []

  if (project.stewards?.length) {
    const names = project.stewards
      .filter((s): s is Exclude<typeof s, number> => typeof s === 'object')
      .map((s) => s.displayName)
    if (names.length) lines.push(`Stewards: ${names.map(escape).join(', ')}`)
  }
  if (project.contributors?.length) {
    const names = project.contributors
      .filter((c): c is Exclude<typeof c, number> => typeof c === 'object')
      .map((c) => c.displayName)
    if (names.length) lines.push(`Contributors: ${names.map(escape).join(', ')}`)
  }
  if (project.primaryCTA?.url) {
    lines.push(`[${escape(project.primaryCTA.label || 'Take action')}](${project.primaryCTA.url})`)
  }

  return { body: lines.join('\n'), heading: 'Project State' }
}

export const projectsAdapter: CollectionAdapter<Project> = {
  collection: 'projects',
  key: 'slug',
  renderDetail: (project) => [
    {
      body: keyValueLine([
        ['Status', project.projectStatus ?? undefined],
        ['Kind', project.projectKind ?? undefined],
        ['Last active', project.lastActiveAt ? formatDateTime(project.lastActiveAt) : undefined],
        [
          'Skills',
          project.profileSkills?.length
            ? project.profileSkills
                .filter((s): s is Exclude<typeof s, number> => typeof s === 'object')
                .map((s) => s.title)
                .join(', ')
            : undefined,
        ],
      ]),
    },
    { body: renderLexical(project.description) },
    entriesSection(
      'What Is Happening',
      project.currentState?.map((s) => ({ body: s.body })),
    ),
    projectStateSection(project),
    relationListSection('Activity', project.activityItems, (doc) => ({
      label: doc.title,
      meta: `${doc.activityType} · ${formatDateTime(doc.happenedAt)}`,
    })),
    relationListSection('Threads', project.threads, (doc) => ({
      href: internalHref('threads', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Next Sessions', project.events, (doc) => ({
      href: internalHref('events', doc.id),
      label: doc.title,
      meta: formatDateTime(doc.startsAt),
    })),
    linkListSection(
      'Ways to Contribute',
      project.contributionActions?.map((a) => ({ label: a.title, note: a.description, url: a.url })),
    ),
    linkListSection(
      'Resources',
      [
        ...(project.resources ?? []).map((r) => ({ label: r.label, note: r.resourceType, url: r.url })),
        ...(project.links ?? []).map((l) => ({ label: l.label, url: l.url })),
      ],
    ),
    linkListSection(
      'Open Questions',
      project.openQuestions?.map((q) => ({
        label: q.question,
        note: q.status === 'answered' && q.answer ? `Answer: ${q.answer}` : undefined,
      })),
    ),
  ],
}
