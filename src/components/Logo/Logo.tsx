import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = ({ className }: Props) => {
  return (
    <span className={`inline-flex items-center gap-3 text-foreground ${className || ''}`}>
      <span
        aria-label="RaidGuild crossed swords"
        className="block h-10 w-10 shrink-0 bg-current"
        role="img"
        style={{
          mask: "url('/assets/symbol-m800.svg') center / contain no-repeat",
          WebkitMask: "url('/assets/symbol-m800.svg') center / contain no-repeat",
        }}
      />
      <span className="hidden font-display text-xl font-bold leading-none tracking-[-0.01em] sm:inline">
        RaidGuild Portal
      </span>
    </span>
  )
}
