import type { Where } from 'payload'

import type { MarkdownSection } from '../lib/markdownPrimitives'

export type { MarkdownSection }

export type CollectionAdapter<TDoc> = {
  collection: string
  /** Extra where-clause conditions beyond the shared public/published filter (e.g. wiki's reviewStatus). */
  extraWhere?: (parts: string[]) => Where | undefined
  key: 'id' | 'slug'
  /** Ordered sections for the detail view; empty-body sections are dropped by the joiner. */
  renderDetail: (doc: TDoc) => MarkdownSection[]
  /** List-view summary line; defaults to `doc.summary` in route.ts when omitted. */
  listSummary?: (doc: TDoc) => string | null | undefined
}
