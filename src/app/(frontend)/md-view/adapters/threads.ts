import type { Thread } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import {
  escape,
  internalHref,
  keyValueLine,
  linkListSection,
  relationListSection,
} from '../lib/markdownPrimitives'
import type { CollectionAdapter } from './types'

export const threadsAdapter: CollectionAdapter<Thread> = {
  collection: 'threads',
  key: 'slug',
  renderDetail: (thread) => [
    {
      body: keyValueLine([
        ['Status', thread.threadStatus],
        ['Updated', thread.lastActiveAt ? formatDateTime(thread.lastActiveAt) : undefined],
      ]),
    },
    { body: thread.summary ? escape(thread.summary) : '' },
    linkListSection('Links', thread.links),
    relationListSection('Projects', thread.relatedProjects, (doc) => ({
      href: internalHref('projects', doc.slug || doc.id),
      label: doc.title,
    })),
    relationListSection('People', thread.participants, (doc) => ({
      href: internalHref('members', doc.handle),
      label: doc.displayName,
    })),
  ],
}
