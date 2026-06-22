'use client'

import React from 'react'

import type { MapManifest } from './mapManifest'

export const MapDebugOverlay: React.FC<{
  manifest: MapManifest
}> = ({ manifest }) => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-[25] h-full w-full"
    preserveAspectRatio="none"
    viewBox={`0 0 ${manifest.size.w} ${manifest.size.h}`}
  >
    {manifest.movement.walkable.map((polygon) => (
      <polygon
        fill="rgba(46, 204, 113, 0.2)"
        key={`walkable-${polygon.id}`}
        points={polygon.points.map((point) => point.join(',')).join(' ')}
        stroke="rgba(46, 204, 113, 0.9)"
        strokeWidth="4"
      />
    ))}
    {manifest.movement.blocked.map((polygon) => (
      <polygon
        fill="rgba(231, 76, 60, 0.24)"
        key={`blocked-${polygon.id}`}
        points={polygon.points.map((point) => point.join(',')).join(' ')}
        stroke="rgba(231, 76, 60, 0.95)"
        strokeWidth="4"
      />
    ))}
    {manifest.pointsOfInterest.map((poi) => (
      <g key={`poi-${poi.id}`}>
        <circle cx={poi.x} cy={poi.y} fill="#f1c40f" r="12" stroke="#1a0d0b" strokeWidth="4" />
        <circle
          cx={poi.x}
          cy={poi.y}
          fill="rgba(241, 196, 15, 0.12)"
          r={poi.triggerRadius}
          stroke="rgba(241, 196, 15, 0.7)"
          strokeDasharray="12 8"
          strokeWidth="3"
        />
      </g>
    ))}
    <circle
      cx={manifest.spawn.x}
      cy={manifest.spawn.y}
      fill="#3498db"
      r={manifest.spawn.characterFootRadius}
      stroke="#1a0d0b"
      strokeWidth="4"
    />
  </svg>
)
