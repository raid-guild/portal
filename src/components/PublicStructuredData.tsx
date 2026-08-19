import React from 'react'

import { getAbsoluteURL } from '@/utilities/getURL'

type Props = {
  description?: string | null
  endDate?: string | null
  image?: string | null
  name: string
  path: string
  startDate?: string | null
  type?: 'Event' | 'Person' | 'ProfilePage' | 'Project' | 'WebPage'
}

export const PublicStructuredData = ({
  description,
  endDate,
  image,
  name,
  path,
  startDate,
  type = 'WebPage',
}: Props) => {
  const url = getAbsoluteURL(path)
  const data = {
    '@context': 'https://schema.org',
    '@id': `${url}#${type.toLowerCase()}`,
    '@type': type,
    name,
    url,
    ...(description ? { description } : {}),
    ...(image ? { image: getAbsoluteURL(image) } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    isPartOf: {
      '@id': `${getAbsoluteURL('/')}#website`,
      '@type': 'WebSite',
      name: 'RaidGuild Portal',
      url: getAbsoluteURL('/'),
    },
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
      type="application/ld+json"
    />
  )
}
