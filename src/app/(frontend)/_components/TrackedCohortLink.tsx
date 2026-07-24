'use client'

import Link from 'next/link'
import React from 'react'

import { trackPortalEvent } from '@/utilities/analytics'

type Props = React.ComponentProps<typeof Link> & {
  cohortSlug: string
  placement: string
}

export const TrackedCohortLink = ({ cohortSlug, onClick, placement, ...props }: Props) => (
  <Link
    {...props}
    onClick={(event) => {
      trackPortalEvent('Cohort CTA Clicked', {
        cohort_slug: cohortSlug,
        placement,
        target_path: typeof props.href === 'string' ? props.href : props.href.pathname || '',
      })
      onClick?.(event)
    }}
  />
)
