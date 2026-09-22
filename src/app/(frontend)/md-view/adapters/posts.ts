import type { Post } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { lexicalToPlainExcerpt, renderLexical } from '../lib/lexicalToMarkdown'
import {
  escape,
  internalHref,
  keyValueLine,
  relationListSection,
  type MarkdownSection,
} from '../lib/markdownPrimitives'
import type { CollectionAdapter } from './types'

const CONTENT_TYPE_LABEL: Record<string, string> = {
  announcement: 'Announcement',
  article: 'Article',
  clip: 'Clip',
  lesson: 'Lesson',
  newsletter: 'Newsletter',
  quote: 'Quote',
  recap: 'Recap',
}

const sourceContextSection = (post: Post): MarkdownSection => {
  const lines: string[] = []

  if (typeof post.sourceSession === 'object' && post.sourceSession) {
    lines.push(
      `Source session: [${escape(post.sourceSession.title)}](${internalHref('events', post.sourceSession.id)})`,
    )
  }
  if (typeof post.parentThread === 'object' && post.parentThread) {
    lines.push(
      `Thread: [${escape(post.parentThread.title)}](${internalHref('threads', post.parentThread.slug || post.parentThread.id)})`,
    )
  }
  if (post.wikiCandidateTopics?.length) {
    lines.push(
      `Wiki candidate topics: ${post.wikiCandidateTopics.map((t) => escape(t.topic)).join(', ')}`,
    )
  } else if (post.wikiCandidate) {
    lines.push('Wiki candidate')
  }

  return { body: lines.join('\n'), heading: 'Source Context' }
}

export const postsAdapter: CollectionAdapter<Post> = {
  collection: 'posts',
  key: 'slug',
  renderDetail: (post) => [
    {
      body: keyValueLine([
        ['Type', CONTENT_TYPE_LABEL[post.contentType ?? ''] ?? post.contentType ?? undefined],
        ['Kind', post.artifactKind ?? undefined],
        ['Published', post.publishedAt ? formatDateTime(post.publishedAt) : undefined],
        [
          'Authors',
          post.populatedAuthors?.length
            ? post.populatedAuthors.map((a) => a.name).filter(Boolean).join(', ')
            : undefined,
        ],
        [
          'Categories',
          post.categories?.length
            ? post.categories
                .filter((c): c is Exclude<typeof c, number> => typeof c === 'object')
                .map((c) => c.title)
                .join(', ')
            : undefined,
        ],
      ]),
    },
    sourceContextSection(post),
    { body: renderLexical(post.content) },
    relationListSection('Related Posts', post.relatedPosts, (doc) => ({
      href: internalHref('posts', doc.slug || doc.id),
      label: doc.title,
    })),
  ],
  listSummary: (post) => lexicalToPlainExcerpt(post.content, 220),
}
