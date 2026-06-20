'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, UserRound } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { User } from '@/payload-types'
import { cn } from '@/utilities/cn'
import type { SelectableMapRole, MapDashboardData } from './mapData'
import {
  mapBackgroundPath,
  mapLocations,
  type MapLocationConfig,
  type MapLocationID,
} from './mapConfig'
import { MapCharacterSelector } from './MapCharacterSelector'
import { MapLocationDialog } from './MapLocationDialog'
import { MapSprite } from './MapSprite'
import { useMapMovement } from './useMapMovement'

type MapDashboardClientProps = {
  data: MapDashboardData
  fontClassName: string
  user: User
}

export const MapDashboardClient: React.FC<MapDashboardClientProps> = ({
  data,
  fontClassName,
  user,
}) => {
  const movement = useMapMovement()
  const storageKey = `portal-map-character:${data.profile?.id || user.id}`
  const [activeLocationID, setActiveLocationID] = useState<MapLocationID | null>(null)
  const [hasLoadedCharacter, setHasLoadedCharacter] = useState(false)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<SelectableMapRole | null>(null)
  const activeLocation = useMemo(
    () => mapLocations.find((location) => location.id === activeLocationID) || null,
    [activeLocationID],
  )
  const selectedLabel = selectedRole ? `${selectedRole.title} form` : 'Guild character'

  useEffect(() => {
    document.body.classList.add('map-dashboard-fullscreen')

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

    movement.travelTo(location.nodeID, () => setActiveLocationID(location.id))
  }

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

        {mapLocations.map((location) => (
          <button
            aria-label={`Travel to ${location.label}`}
            className="map-location-marker"
            disabled={movement.isMoving || location.disabled}
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
            x={movement.position.x}
            y={movement.position.y}
          />
        ) : null}
      </div>

      <div className="map-dashboard-hud map-dashboard-hud-top">
        <div className="map-dashboard-status">
          <span>
            {movement.isMoving ? 'Traveling' : selectedRole ? selectedRole.title : 'Choose form'}
          </span>
        </div>
        <div className="map-dashboard-actions">
          <Button asChild className="map-dashboard-button" size="sm" variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
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
