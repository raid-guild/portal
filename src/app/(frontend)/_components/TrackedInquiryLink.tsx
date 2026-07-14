'use client'

import Link from 'next/link'
import React from 'react'

import type { InquiryAnalyticsType } from '@/utilities/analytics'
import { trackPortalEvent } from '@/utilities/analytics'

type Props = React.ComponentProps<typeof Link> & {
  formVariant?: 'legacy_sponsor' | 'typed'
  inquiryType: InquiryAnalyticsType
  placement: string
}

export const TrackedInquiryLink: React.FC<Props> = ({
  formVariant = 'typed',
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
      onClick?.(event)
    }}
  />
)
