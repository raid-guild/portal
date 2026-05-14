import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Follow the weekly brief, see active projects, join upcoming sessions, and plug into real opportunities across RaidGuild.',
  images: [
    {
      alt: 'RaidGuild Portal',
      height: 166,
      url: `${getServerSideURL()}/assets/image.png`,
      width: 589,
    },
  ],
  siteName: 'RaidGuild Portal',
  title: 'RaidGuild Portal | Find the work already in motion',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
