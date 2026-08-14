import type { Metadata } from 'next'

import { getAbsoluteURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const POSTS_META_DESCRIPTION =
  'Read RaidGuild updates, recaps, lessons, and announcements from work happening across the community.'

export const generatePostsMetadata = (pageNumber?: number): Metadata => {
  const path = pageNumber ? `/posts/page/${pageNumber}` : '/posts'
  const title = pageNumber ? `RaidGuild Portal Posts Page ${pageNumber}` : 'RaidGuild Portal Posts'
  const canonicalURL = getAbsoluteURL(path)

  return {
    alternates: { canonical: canonicalURL },
    description: POSTS_META_DESCRIPTION,
    openGraph: mergeOpenGraph({
      description: POSTS_META_DESCRIPTION,
      title,
      type: 'website',
      url: canonicalURL,
    }),
    title: { absolute: title },
  }
}
