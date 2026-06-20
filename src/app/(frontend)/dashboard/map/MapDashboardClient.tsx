'use client'

import Link from 'next/link'
import { Compass, MapPin, UserRound } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { User } from '@/payload-types'
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
  user: User
}

export const MapDashboardClient: React.FC<MapDashboardClientProps> = ({ data, user }) => {
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
    <main className="min-h-screen bg-neutral-black text-foreground">
      <header className="border-b border-border bg-neutral-black/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="portal-kicker">{data.copy.eyebrow}</p>
            <h1 className="mt-2 portal-heading">{data.copy.headline}</h1>
            <p className="mt-2 max-w-2xl portal-body-sm">{data.copy.intro}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              onClick={() => setIsSelectorOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <UserRound className="mr-2 h-4 w-4" />
              Character
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="overflow-x-auto border border-border bg-card/20 p-2">
          <div className="relative aspect-video min-w-[860px] overflow-hidden bg-neutral-black">
            <img
              alt="RaidGuild adventure map with forests, roads, villages, castles, a lake, and swamp."
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              src={mapBackgroundPath}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-black/10 via-transparent to-neutral-black/20" />

            {mapLocations.map((location) => (
              <button
                aria-label={`Travel to ${location.label}`}
                className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-scroll-100"
                disabled={movement.isMoving || location.disabled}
                key={location.id}
                onClick={() => travelToLocation(location)}
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                }}
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-scroll-300 bg-neutral-black/80 text-scroll-100 shadow-lg">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="max-w-[120px] border border-border bg-neutral-black/85 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase leading-tight text-scroll-100 shadow-lg">
                  {location.label}
                </span>
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

            <div className="absolute bottom-3 left-3 z-20 border border-border bg-neutral-black/85 px-3 py-2">
              <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-scroll-100">
                <Compass className="h-4 w-4" />
                {movement.isMoving
                  ? 'Traveling...'
                  : selectedRole
                    ? selectedRole.title
                    : 'Choose form'}
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Map destinations" className="mt-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {mapLocations.map((location) => (
              <Button
                className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left leading-tight"
                disabled={movement.isMoving || location.disabled}
                key={location.id}
                onClick={() => travelToLocation(location)}
                type="button"
                variant={location.disabled ? 'outline' : 'secondary'}
              >
                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                {location.label}
              </Button>
            ))}
          </div>
        </nav>
      </section>

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
