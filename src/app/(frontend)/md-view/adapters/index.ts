import { cohortsAdapter } from './cohorts'
import { eventsAdapter } from './events'
import { postsAdapter } from './posts'
import { projectsAdapter } from './projects'
import { threadsAdapter } from './threads'
import type { CollectionAdapter } from './types'
import { wikiAdapter } from './wiki'

export const adapters = {
  cohorts: cohortsAdapter,
  events: eventsAdapter,
  posts: postsAdapter,
  projects: projectsAdapter,
  threads: threadsAdapter,
  wiki: wikiAdapter,
} as const satisfies Record<string, CollectionAdapter<any>>

export type MarkdownRouteKey = keyof typeof adapters
