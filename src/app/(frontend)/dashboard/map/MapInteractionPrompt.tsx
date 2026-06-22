'use client'

import { CornerDownLeft } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import type { MapManifestPointOfInterest } from './mapManifest'

export const MapInteractionPrompt: React.FC<{
  onInteract: () => void
  poi: MapManifestPointOfInterest
}> = ({ onInteract, poi }) => (
  <div aria-label="Nearby map location" className="map-interaction-prompt" role="region">
    <div>
      <p>{poi.label}</p>
      {poi.region ? <span>{poi.region}</span> : null}
    </div>
    <Button className="map-dashboard-button" onClick={onInteract} size="sm" type="button">
      <CornerDownLeft className="h-4 w-4" />
      {poi.actionLabel || 'Enter'}
    </Button>
  </div>
)
