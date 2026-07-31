'use client'

import Link from 'next/link'
import React from 'react'

import type { InquiryAnalyticsType } from '@/utilities/analytics'
import { trackPortalEvent } from '@/utilities/analytics'

type Props = React.ComponentProps<typeof Link> & {
  cohortInterestIntent?: 'interested' | 'suggest-topic'
  cohortSlug?: string
  formVariant?: 'legacy_sponsor' | 'typed'
  inquiryType: InquiryAnalyticsType
  placement: string
  postSlug?: string
}

export const TrackedInquiryLink: React.FC<Props> = ({
  formVariant = 'typed',
  cohortInterestIntent,
  cohortSlug,
  inquiryType,
  onClick,
  placement,
  postSlug,
  ...props
}) => (
  <Link
    {...props}
    onClick={(event) => {
      trackPortalEvent('Inquiry CTA Clicked', {
        form_variant: formVariant,
        inquiry_type: inquiryType,
        placement,
        ...(postSlug ? { post_slug: postSlug } : {}),
      })
      if (cohortSlug && cohortInterestIntent) {
        trackPortalEvent('Cohort Interest Clicked', {
          cohort_slug: cohortSlug,
          intent: cohortInterestIntent,
          placement,
          ...(postSlug ? { post_slug: postSlug } : {}),
        })
      }
      onClick?.(event)
    }}
  />
)
