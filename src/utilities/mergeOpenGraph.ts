import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

export const defaultPortalImage = {
  alt: 'RaidGuild Portal: a shared gateway to Guild activity, content, and tools',
  height: 909,
  url: `${getServerSideURL()}/assets/raidguild-portal-social-2026.png`,
  width: 1731,
}

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Follow the weekly brief, see active projects, join upcoming sessions, and plug into real opportunities across RaidGuild.',
  images: [defaultPortalImage],
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
