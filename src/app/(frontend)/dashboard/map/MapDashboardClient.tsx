'use client'

import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  ArrowUp,
  MapPin,
  UserRound,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { User } from '@/payload-types'
import { cn } from '@/utilities/cn'
import type { SelectableMapRole, MapDashboardData } from './mapData'
import { getNearestTriggeredPOI } from './mapGeometry'
import { mapManifest } from './mapManifest'
import {
  mapBackgroundPath,
  mapLocations,
  type MapLocationConfig,
  type MapLocationID,
} from './mapConfig'
import { MapCharacterSelector } from './MapCharacterSelector'
import { MapDebugOverlay } from './MapDebugOverlay'
import { MapInteractionPrompt } from './MapInteractionPrompt'
import { MapLocationDialog } from './MapLocationDialog'
import { MapSprite } from './MapSprite'
import { useFreeWalkMovement } from './useFreeWalkMovement'

type MapDashboardClientProps = {
  data: MapDashboardData
  fontClassName: string
  user: User
}

const isInteractiveEventTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(
    target.closest(
      'a, button, input, textarea, select, summary, [role="button"], [role="link"], [tabindex]',
    ),
  )
}

export const MapDashboardClient: React.FC<MapDashboardClientProps> = ({
  data,
  fontClassName,
  user,
}) => {
  const storageKey = `portal-map-character:${data.profile?.id || user.id}`
  const [activeLocationID, setActiveLocationID] = useState<MapLocationID | null>(null)
  const [hasLoadedCharacter, setHasLoadedCharacter] = useState(false)
  const [isDebugOverlayVisible, setIsDebugOverlayVisible] = useState(false)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<SelectableMapRole | null>(null)
  const isMovementEnabled = Boolean(selectedRole) && !isSelectorOpen && !activeLocationID
  const movement = useFreeWalkMovement({
    enabled: isMovementEnabled,
    manifest: mapManifest,
  })
  const activeLocation = useMemo(
    () => mapLocations.find((location) => location.id === activeLocationID) || null,
    [activeLocationID],
  )
  const nearbyPOI = useMemo(
    () => getNearestTriggeredPOI(movement.sourcePosition, mapManifest.pointsOfInterest),
    [movement.sourcePosition],
  )
  const nearbyLocation = useMemo(
    () => mapLocations.find((location) => location.id === nearbyPOI?.id) || null,
    [nearbyPOI],
  )
  const selectedLabel = selectedRole ? `${selectedRole.title} form` : 'Guild character'

  useEffect(() => {
    document.body.classList.add('map-dashboard-fullscreen')
    setIsDebugOverlayVisible(new URLSearchParams(window.location.search).get('mapDebug') === '1')

    return () => {
      document.body.classList.remove('map-dashboard-fullscreen')
    }
  }, [])

  useEffect(() => {
    const storedSprite = window.localStorage.getItem(storageKey)
    const storedRole =
      data.selectableRoles.find((role) => role.available && role.spriteSlug === storedSprite) ||
      null

    if (storedRole) {
      setSelectedRole(storedRole)
    } else {
      window.localStorage.removeItem(storageKey)
      setIsSelectorOpen(true)
    }

    setHasLoadedCharacter(true)
  }, [data.selectableRoles, storageKey])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!nearbyLocation || !isMovementEnabled) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (nearbyLocation.disabled || isInteractiveEventTarget(event.target)) return

      event.preventDefault()
      setActiveLocationID(nearbyLocation.id)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMovementEnabled, nearbyLocation])

  const selectRole = (role: SelectableMapRole) => {
    if (!role.available || !role.spriteSlug) return

    setSelectedRole(role)
    window.localStorage.setItem(storageKey, role.spriteSlug)
    setIsSelectorOpen(false)
  }

  const travelToLocation = (location: MapLocationConfig) => {
    if (!selectedRole) {
      setIsSelectorOpen(true)
      return
    }

    if (location.disabled) return

    setActiveLocationID(location.id)
  }

  const directionButtons = [
    { direction: 'up' as const, icon: ArrowUp, label: 'Move up' },
    { direction: 'left' as const, icon: ArrowLeftIcon, label: 'Move left' },
    { direction: 'right' as const, icon: ArrowRight, label: 'Move right' },
    { direction: 'down' as const, icon: ArrowDown, label: 'Move down' },
  ]

  return (
    <main className={cn('map-dashboard-screen fixed inset-0 z-40 bg-neutral-black', fontClassName)}>
      <div className="map-dashboard-stage">
        <img
          alt="RaidGuild adventure map with forests, roads, villages, castles, a lake, and swamp."
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          src={mapBackgroundPath}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-black/5 via-transparent to-neutral-black/20" />
        {isDebugOverlayVisible ? <MapDebugOverlay manifest={mapManifest} /> : null}

        {mapLocations.map((location) => (
          <button
            aria-label={`Travel to ${location.label}`}
            className="map-location-marker"
            disabled={location.disabled}
            key={location.id}
            onClick={() => travelToLocation(location)}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
            }}
            type="button"
          >
            <span className="map-location-pin">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="map-location-label">{location.label}</span>
          </button>
        ))}

        {hasLoadedCharacter && selectedRole?.spriteSlug ? (
          <MapSprite
            direction={movement.direction}
            label={selectedLabel}
            onActivate={() => setIsSelectorOpen(true)}
            spriteSlug={selectedRole.spriteSlug}
            x={movement.renderPosition.x}
            y={movement.renderPosition.y}
          />
        ) : null}
      </div>

      <div className="map-dashboard-hud map-dashboard-hud-top">
        <div className="map-dashboard-status">
          <span>
            {nearbyLocation
              ? `Near ${nearbyLocation.label}`
              : movement.isMoving
                ? 'Free walking'
                : selectedRole
                  ? selectedRole.title
                  : 'Choose form'}
          </span>
        </div>
        <div className="map-dashboard-actions">
          <Button asChild className="map-dashboard-button" size="sm" variant="outline">
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            className="map-dashboard-button"
            onClick={() => setIsSelectorOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <UserRound className="h-4 w-4" />
            Character
          </Button>
        </div>
      </div>

      <div className="map-dashboard-hud map-dashboard-hud-bottom">
        <div className="map-dpad" aria-label="Map movement controls">
          {directionButtons.map(({ direction, icon: Icon, label }) => (
            <button
              aria-label={label}
              className={`map-dpad-button map-dpad-button-${direction}`}
              disabled={!isMovementEnabled}
              key={direction}
              onBlur={() => movement.setDirectionHeld(direction, false)}
              onPointerCancel={() => movement.setDirectionHeld(direction, false)}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                movement.setDirectionHeld(direction, true)
              }}
              onPointerLeave={() => movement.setDirectionHeld(direction, false)}
              onPointerUp={() => movement.setDirectionHeld(direction, false)}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {nearbyPOI && nearbyLocation && !nearbyLocation.disabled && isMovementEnabled ? (
        <MapInteractionPrompt
          onInteract={() => setActiveLocationID(nearbyLocation.id)}
          poi={nearbyPOI}
        />
      ) : null}

      {isSelectorOpen ? (
        <MapCharacterSelector
          currentSpriteSlug={selectedRole?.spriteSlug}
          dailyEngagementSummary={data.dailyEngagementSummary}
          isDismissible={Boolean(selectedRole)}
          onClose={() => setIsSelectorOpen(false)}
          onSelect={selectRole}
          pointsTotal={data.pointsTotal}
          profile={data.profile}
          roles={data.selectableRoles}
          user={user}
        />
      ) : null}

      {activeLocation ? (
        <MapLocationDialog
          data={data}
          location={activeLocation}
          onClose={() => setActiveLocationID(null)}
        />
      ) : null}
    </main>
  )
}
