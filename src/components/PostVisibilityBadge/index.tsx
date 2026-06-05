import React from 'react'

import { cn } from '@/utilities/cn'
import { getPostVisibilityLabel } from '@/utilities/postVisibility'

export const PostVisibilityBadge: React.FC<{
  className?: string
  visibility?: string | null
}> = ({ className, visibility }) => {
  const label = getPostVisibilityLabel(visibility)

  if (!label) return null

  return (
    <span
      aria-label={`Post visibility: ${label}`}
      className={cn('portal-pill inline-flex w-fit items-center', className)}
    >
      {label}
    </span>
  )
}
