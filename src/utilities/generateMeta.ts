import type { Metadata } from 'next'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getAbsoluteURL } from './getURL'

const SITE_TITLE = 'RaidGuild Portal'
const TRAILING_SITE_SUFFIXES = /(?:\s*\|\s*RaidGuild(?:\s+Portal)?\s*)+$/i

export const normalizePortalTitle = (sourceTitle?: string | null) => {
  if (!sourceTitle) return SITE_TITLE

  const normalizedTitle = sourceTitle.replace(TRAILING_SITE_SUFFIXES, '').trim()

  return normalizedTitle ? `${normalizedTitle} | ${SITE_TITLE}` : SITE_TITLE
}

type MetadataImage = { alt?: string | null; url?: string | null }

export type PortalMetadataDocument = {
  _status?: string | null
  description?: unknown
  meta?: {
    description?: string | null
    image?: MetadataImage | number | null
    title?: string | null
  } | null
  name?: string | null
  populatedAuthors?: Array<{ name?: string | null }> | null
  publishedAt?: string | null
  slug?: string | null
  summary?: string | null
  title?: string | null
  updatedAt?: string | null
  visibility?: string | null
}

const normalizeDescription = (value?: unknown) => {
  const normalized = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : undefined
  if (!normalized) return undefined
  return normalized.length > 200 ? `${normalized.slice(0, 197).trimEnd()}…` : normalized
}

export const generateMeta = async (args: {
  doc: PortalMetadataDocument
  description?: string
  image?: MetadataImage | null
  path?: string
  type?: 'article' | 'website'
}): Promise<Metadata> => {
  const { doc, path, type = 'website' } = args || {}

  if (doc?._status === 'draft' || (doc?.visibility && doc.visibility !== 'public')) {
    return { robots: { follow: false, index: false } }
  }

  const sourceImage = args.image || doc?.meta?.image
  const ogImage =
    typeof sourceImage === 'object' && sourceImage !== null && typeof sourceImage.url === 'string'
      ? getAbsoluteURL(sourceImage.url)
      : undefined

  const sourceTitle = doc?.meta?.title || doc.title || doc.name
  const title = normalizePortalTitle(sourceTitle)
  const canonicalPath = path || (typeof doc?.slug === 'string' ? `/${doc.slug}` : '/')
  const canonicalURL = getAbsoluteURL(canonicalPath)
  const description = normalizeDescription(
    args.description || doc?.meta?.description || doc.summary || doc.description,
  )
  const authors =
    'populatedAuthors' in doc
      ? doc.populatedAuthors?.map((author) => author.name).filter((name): name is string => !!name)
      : undefined

  return {
    alternates: { canonical: canonicalURL },
    description,
    openGraph: mergeOpenGraph({
      description,
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
    twitter: {
      card: 'summary_large_image',
      description,
      images: ogImage ? [ogImage] : undefined,
      title,
    },
    title: { absolute: title },
  }
}
