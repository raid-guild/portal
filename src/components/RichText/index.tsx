import { cn } from '@/utilities/cn'
import React from 'react'

import { serializeLexical } from './serialize'

type Props = {
  analyticsContext?: {
    placement: string
    postSlug?: string
  }
  className?: string
  content: Record<string, any>
  enableGutter?: boolean
  enableProse?: boolean
}

const RichText: React.FC<Props> = ({
  analyticsContext,
  className,
  content,
  enableGutter = true,
  enableProse = true,
}) => {
  if (!content) {
    return null
  }

  return (
    <div
      data-analytics-placement={analyticsContext?.placement}
      data-analytics-post-slug={analyticsContext?.postSlug}
      className={cn(
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose dark:prose-invert ': enableProse,
        },
        className,
      )}
    >
      {content &&
        !Array.isArray(content) &&
        typeof content === 'object' &&
        'root' in content &&
        serializeLexical({ nodes: content?.root?.children })}
    </div>
  )
}

export default RichText
