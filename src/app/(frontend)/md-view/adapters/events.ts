import type { Event, Profile } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import {
  bulletListSection,
  escape,
  internalHref,
  keyValueLine,
  linkListSection,
  relationListSection,
  type MarkdownSection,
} from '../lib/markdownPrimitives'
import type { CollectionAdapter } from './types'

const SESSION_TYPE_LABEL: Record<string, string> = {
  'all-hands': 'All Hands',
  brownbag: 'Brownbag',
  demo: 'Demo',
  fireside: 'Fireside',
  kickoff: 'Kickoff',
  'office-hours': 'Office Hours',
  pitch: 'Pitch',
  'guest-talk': 'Guest Talk',
  workshop: 'Workshop',
}

const locationSection = (event: Event): MarkdownSection => {
  const lines: string[] = []
  if (event.locationLabel) lines.push(escape(event.locationLabel))
  if (event.joinURL) lines.push(`[Join](${event.joinURL})`)
  if (event.calendarURL) lines.push(`[Calendar](${event.calendarURL})`)
  if (event.discordEventURL) lines.push(`[Discord event](${event.discordEventURL})`)

  return { body: lines.join('\n'), heading: 'Location & Links' }
}

const sourceMaterialSection = (event: Event): MarkdownSection => {
  const lines: string[] = []
  if (event.recordingURL) lines.push(`[Recording](${event.recordingURL})`)
  if (event.summaryArtifactURL) lines.push(`[Summary](${event.summaryArtifactURL})`)
  if (event.transcriptArtifactURL) lines.push(`[Transcript](${event.transcriptArtifactURL})`)
  if (event.sourceArtifactURL) lines.push(`[Source artifact](${event.sourceArtifactURL})`)
  if (event.sourceArtifactID) lines.push(`Artifact ID: \`${event.sourceArtifactID}\``)

  return { body: lines.join('\n'), heading: 'Source Material' }
}

const peopleSection = (event: Event): MarkdownSection => {
  const byId = new Map<number, Profile>()
  const addAll = (profiles: (number | Profile)[] | null | undefined) => {
    for (const profile of profiles ?? []) {
      if (typeof profile === 'object' && profile) byId.set(profile.id, profile)
    }
  }
  addAll(event.hostProfiles)
  addAll(event.speakerProfiles)
  addAll(event.relatedProfiles)
  if (typeof event.speaker === 'object' && event.speaker) byId.set(event.speaker.id, event.speaker)

  const lines = [...byId.values()].map(
    (profile) => `- [${escape(profile.displayName)}](${internalHref('members', profile.handle)})`,
  )

  return { body: lines.join('\n'), heading: 'People' }
}

const seriesNavigationSection = (event: Event): MarkdownSection => {
  const lines: string[] = []
  if (typeof event.previousOccurrence === 'object' && event.previousOccurrence) {
    lines.push(
      `Previous: [${escape(event.previousOccurrence.title)}](${internalHref('events', event.previousOccurrence.id)})`,
    )
  }
  if (typeof event.nextOccurrence === 'object' && event.nextOccurrence) {
    lines.push(
      `Next: [${escape(event.nextOccurrence.title)}](${internalHref('events', event.nextOccurrence.id)})`,
    )
  }

  return { body: lines.join('\n'), heading: 'Series Navigation' }
}

export const eventsAdapter: CollectionAdapter<Event> = {
  collection: 'events',
  key: 'id',
  renderDetail: (event) => [
    {
      body: keyValueLine([
        ['Session type', SESSION_TYPE_LABEL[event.sessionType] ?? event.sessionType],
        ['Status', event.sourceStatus ?? undefined],
        ['Series', event.seriesTitle || event.seriesKey || undefined],
        ['Starts', formatDateTime(event.startsAt)],
        ['Ends', event.endsAt ? formatDateTime(event.endsAt) : undefined],
      ]),
    },
    { body: event.summary ? escape(event.summary) : '', heading: 'Session Notes' },
    locationSection(event),
    sourceMaterialSection(event),
    linkListSection(
      'Resources',
      event.resources?.map((r) => ({ label: r.label, note: r.resourceType, url: r.url })),
    ),
    relationListSection('Related Cohorts', event.relatedCohorts, (doc) => ({
      href: internalHref('cohorts', doc.slug),
      label: doc.title,
    })),
    relationListSection('Related Projects', event.relatedProjects, (doc) => ({
      href: internalHref('projects', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Related Threads', event.relatedThreads, (doc) => ({
      href: internalHref('threads', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('Related Profiles', event.relatedProfiles, (doc) => ({
      href: internalHref('members', doc.handle),
      label: doc.displayName,
    })),
    peopleSection(event),
    seriesNavigationSection(event),
    bulletListSection(
      'Wiki Candidates',
      event.wikiCandidateTopics?.map((t) => t.topic),
    ),
    bulletListSection(
      'Themes',
      event.themes?.map((t) => t.theme),
    ),
    linkListSection(
      'Published Social Links',
      event.linkedSocialPosts?.map((p) => ({ label: p.label || p.platform, url: p.url })),
    ),
  ],
}
