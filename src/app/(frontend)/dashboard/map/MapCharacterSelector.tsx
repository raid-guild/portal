'use client'

import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import type { Profile, User } from '@/payload-types'
import { cn } from '@/utilities/cn'
import type { SelectableMapRole } from './mapData'
import { MapDialog } from './MapDialog'

type MapCharacterSelectorProps = {
  currentSpriteSlug?: string | null
  dailyEngagementSummary: {
    currentStreak: number
    hasCheckedInToday: boolean
    todayVibe?: null | string
  }
  isDismissible?: boolean
  onClose?: () => void
  onSelect: (role: SelectableMapRole) => void
  pointsTotal: number
  profile: null | Profile
  roles: SelectableMapRole[]
  user: User
}

export const MapCharacterSelector: React.FC<MapCharacterSelectorProps> = ({
  currentSpriteSlug,
  dailyEngagementSummary,
  isDismissible = true,
  onClose,
  onSelect,
  pointsTotal,
  profile,
  roles,
  user,
}) => {
  const availableRoles = roles.filter((role) => role.available)

  return (
    <MapDialog
      description="Choose one of your profile roles to materialize on the map."
      isDismissible={isDismissible}
      onClose={onClose}
      title="Choose Your Guild Form"
    >
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="border border-border bg-neutral-black/35 p-4">
          <p className="portal-kicker">Profile</p>
          <h3 className="mt-2 portal-heading-sm">{profile?.displayName || user.name || user.email}</h3>
          {profile?.handle ? (
            <Link className="portal-link mt-1 inline-block" href={`/members/${profile.handle}`}>
              @{profile.handle}
            </Link>
          ) : null}
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="portal-kicker">Guild points</dt>
              <dd className="mt-1 font-mono text-xl font-bold">{pointsTotal}</dd>
            </div>
            <div>
              <dt className="portal-kicker">Daily streak</dt>
              <dd className="mt-1 text-muted-foreground">
                {dailyEngagementSummary.currentStreak} day
                {dailyEngagementSummary.currentStreak === 1 ? '' : 's'}
              </dd>
            </div>
          </dl>
          <Button asChild className="mt-5 w-full" size="sm" variant="outline">
            <Link href="/me">Edit profile</Link>
          </Button>
        </aside>

        <div>
          {!profile ? (
            <div className="border border-border bg-card/30 p-4">
              <p className="portal-body-sm">
                Your map form is tied to your contributor profile. Create or finish your profile,
                then return to the map.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/me">Open profile</Link>
              </Button>
            </div>
          ) : null}

          {profile && !roles.length ? (
            <div className="border border-border bg-card/30 p-4">
              <p className="portal-body-sm">
                No profile roles are selected yet. Pick a guild role on your profile to unlock a
                map character.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/me">Choose roles</Link>
              </Button>
            </div>
          ) : null}

          {roles.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {roles.map((role) => {
                const isSelected = role.spriteSlug === currentSpriteSlug

                return (
                  <button
                    className={cn(
                      'min-h-[142px] border p-4 text-left transition-colors',
                      role.available
                        ? 'border-border bg-card/35 hover:border-primary hover:bg-card/60'
                        : 'cursor-not-allowed border-border/70 bg-neutral-black/40 opacity-70',
                      isSelected ? 'border-scroll-300 bg-primary/20' : '',
                    )}
                    disabled={!role.available}
                    key={role.slug}
                    onClick={() => onSelect(role)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      {role.spriteSlug ? (
                        <span
                          aria-hidden="true"
                          className="h-[68px] w-[54px] shrink-0 [image-rendering:pixelated]"
                          style={{
                            backgroundImage: `url(/assets/map/sprites/characters/${role.spriteSlug}.png)`,
                            backgroundPosition: '0 0',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '540px 68px',
                          }}
                        />
                      ) : (
                        <span className="flex h-[68px] w-[54px] shrink-0 items-center justify-center border border-border bg-background/70 font-mono text-xs">
                          ?
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block break-words font-display text-base font-bold leading-tight">
                          {role.title}
                        </span>
                        <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground">
                          {role.available
                            ? role.description || 'Ready to walk the painted roads.'
                            : 'Character art is still being forged. Keep the role, or adjust roles from your profile.'}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {profile && roles.length > 0 && !availableRoles.length ? (
            <div className="mt-4 border border-warning/60 bg-warning/10 p-4">
              <p className="portal-body-sm">
                Your selected roles do not have v1 map art yet. Apprentice and Bard will stay
                visible here, then unlock after the art pass.
              </p>
              <Button asChild className="mt-4" size="sm" variant="outline">
                <Link href="/me">Adjust roles</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </MapDialog>
  )
}
