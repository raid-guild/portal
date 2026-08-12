import type { Metadata } from 'next'

import type { Page, Post } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getAbsoluteURL } from './getURL'

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post>
  path?: string
  type?: 'article' | 'website'
}): Promise<Metadata> => {
  const { doc, path, type = 'website' } = args || {}

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    typeof doc.meta.image.url === 'string'
      ? getAbsoluteURL(doc.meta.image.url)
      : undefined

  const sourceTitle = doc?.meta?.title || ('title' in doc ? doc.title : undefined)
  const title = sourceTitle
    ? sourceTitle.includes('RaidGuild Portal')
      ? sourceTitle
      : `${sourceTitle} | RaidGuild Portal`
    : 'RaidGuild Portal'
  const canonicalPath = path || (typeof doc?.slug === 'string' ? `/${doc.slug}` : '/')
  const canonicalURL = getAbsoluteURL(canonicalPath)
  const authors =
    'populatedAuthors' in doc
      ? doc.populatedAuthors?.map((author) => author.name).filter((name): name is string => !!name)
      : undefined

  return {
    alternates: { canonical: canonicalURL },
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      type,
      url: canonicalURL,
      ...(type === 'article' && 'publishedAt' in doc
        ? {
            authors,
            modifiedTime: doc.updatedAt,
            publishedTime: doc.publishedAt || undefined,
          }
        : {}),
    }),
    title: { absolute: title },
  }
}
