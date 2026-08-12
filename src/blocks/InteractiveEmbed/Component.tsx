import React from 'react'

import type { InteractiveEmbedBlock as InteractiveEmbedBlockProps } from '@/payload-types'
import { toInteractiveArtifactURL } from '@/utilities/interactiveArtifactURL'
import { cn } from '@/utilities/cn'
import { Media } from '@/components/Media'

type Props = InteractiveEmbedBlockProps & {
  className?: string
}

export const InteractiveEmbedBlock: React.FC<Props> = ({
  caption,
  className,
  height,
  previewImage,
  showOpenLink,
  title,
  url,
}) => {
  const safeURL = toInteractiveArtifactURL(url)

  if (!safeURL) return null

  return (
    <figure className={cn('not-prose my-10 w-full', className)}>
      <div className="overflow-hidden border border-border bg-[#0b0e14]">
        <iframe
          className="block w-full"
          height={height || 640}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts"
          src={safeURL}
          title={title}
        />
      </div>
      {caption || showOpenLink ? (
        <figcaption className="mt-3 flex flex-wrap items-start justify-between gap-3 text-sm leading-6 text-muted-foreground">
          {caption ? <span>{caption}</span> : <span />}
          {showOpenLink ? (
            <a className="portal-link shrink-0" href={safeURL} rel="noreferrer" target="_blank">
              Open interactive
            </a>
          ) : null}
        </figcaption>
      ) : null}
      {previewImage && typeof previewImage === 'object' ? (
        <noscript>
          <Media imgClassName="mt-4 h-auto w-full border border-border" resource={previewImage} />
        </noscript>
      ) : null}
    </figure>
  )
}
