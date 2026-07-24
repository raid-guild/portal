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
}

export const TrackedInquiryLink: React.FC<Props> = ({
  formVariant = 'typed',
  cohortInterestIntent,
  cohortSlug,
  inquiryType,
  onClick,
  placement,
  ...props
}) => (
  <Link
    {...props}
    onClick={(event) => {
      trackPortalEvent('Inquiry CTA Clicked', {
        form_variant: formVariant,
        inquiry_type: inquiryType,
        placement,
      })
      if (cohortSlug && cohortInterestIntent) {
        trackPortalEvent('Cohort Interest Clicked', {
          cohort_slug: cohortSlug,
          intent: cohortInterestIntent,
          placement,
        })
      }
      onClick?.(event)
    }}
  />
)
