'use client'

import React from 'react'

import type { SpriteDirection } from './mapConfig'

const frameByDirection: Record<SpriteDirection, number> = {
  down: 0,
  left: 2,
  right: 3,
  up: 1,
}

export const MapSprite: React.FC<{
  direction: SpriteDirection
  label: string
  onActivate?: () => void
  spriteSlug: string
  x: number
  y: number
}> = ({ direction, label, onActivate, spriteSlug, x, y }) => {
  const frame = frameByDirection[direction]
  const sprite = (
    <span
      aria-hidden="true"
      className="block h-[68px] w-[54px] [image-rendering:pixelated]"
      style={{
        backgroundImage: `url(/assets/map/sprites/characters/${spriteSlug}.png)`,
        backgroundPosition: `-${frame * 54}px 0px`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '540px 68px',
      }}
    />
  )

  return (
    <button
      aria-label={`${label}. Change character.`}
      className="absolute z-20 -translate-x-1/2 -translate-y-full rounded-sm outline-none ring-scroll-100 transition-transform focus-visible:ring-2"
      onClick={onActivate}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      type="button"
    >
      <span className="sr-only">{label}</span>
      <span className="drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">{sprite}</span>
    </button>
  )
}

