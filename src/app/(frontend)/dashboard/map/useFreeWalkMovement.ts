'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SpriteDirection } from './mapConfig'
import { canStandAtPoint, clampPointToMap, toPercentPoint } from './mapGeometry'
import type { MapManifest, MapPixelPoint } from './mapManifest'

type HeldDirection = 'down' | 'left' | 'right' | 'up'

const speedPixelsPerSecond = 230

const keyToDirection: Record<string, HeldDirection | undefined> = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  a: 'left',
  d: 'right',
  s: 'down',
  w: 'up',
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return target.isContentEditable || Boolean(target.closest('input, textarea, select, [contenteditable]'))
}

const getVector = (directions: Set<HeldDirection>) => {
  const x = (directions.has('right') ? 1 : 0) - (directions.has('left') ? 1 : 0)
  const y = (directions.has('down') ? 1 : 0) - (directions.has('up') ? 1 : 0)

  if (!x && !y) return { x: 0, y: 0 }

  const length = Math.hypot(x, y)

  return {
    x: x / length,
    y: y / length,
  }
}

const directionFromVector = (vector: MapPixelPoint, fallback: SpriteDirection): SpriteDirection => {
  if (!vector.x && !vector.y) return fallback

  if (Math.abs(vector.x) > Math.abs(vector.y)) {
    return vector.x > 0 ? 'right' : 'left'
  }

  return vector.y > 0 ? 'down' : 'up'
}

export const useFreeWalkMovement = ({
  enabled,
  manifest,
}: {
  enabled: boolean
  manifest: MapManifest
}) => {
  const [direction, setDirection] = useState<SpriteDirection>(manifest.spawn.facing)
  const [isMoving, setIsMoving] = useState(false)
  const [sourcePosition, setSourcePosition] = useState<MapPixelPoint>({
    x: manifest.spawn.x,
    y: manifest.spawn.y,
  })
  const animationRef = useRef<number | null>(null)
  const heldDirectionsRef = useRef(new Set<HeldDirection>())
  const lastTimestampRef = useRef<number | null>(null)
  const positionRef = useRef(sourcePosition)

  const renderPosition = useMemo(
    () => toPercentPoint(sourcePosition, manifest.size),
    [manifest.size, sourcePosition],
  )

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    lastTimestampRef.current = null
    setIsMoving(false)
  }, [])

  const tryMove = useCallback(
    (from: MapPixelPoint, vector: MapPixelPoint, deltaSeconds: number) => {
      const distance = speedPixelsPerSecond * deltaSeconds
      const desired = clampPointToMap(
        {
          x: from.x + vector.x * distance,
          y: from.y + vector.y * distance,
        },
        manifest.size,
      )

      if (canStandAtPoint(manifest, desired)) return desired

      const horizontal = clampPointToMap({ x: desired.x, y: from.y }, manifest.size)
      if (canStandAtPoint(manifest, horizontal)) return horizontal

      const vertical = clampPointToMap({ x: from.x, y: desired.y }, manifest.size)
      if (canStandAtPoint(manifest, vertical)) return vertical

      return from
    },
    [manifest],
  )

  const tick = useCallback(
    (timestamp: number) => {
      if (!enabled) {
        stopAnimation()
        return
      }

      const vector = getVector(heldDirectionsRef.current)

      if (!vector.x && !vector.y) {
        stopAnimation()
        return
      }

      const lastTimestamp = lastTimestampRef.current ?? timestamp
      const deltaSeconds = Math.min(0.06, Math.max(0, (timestamp - lastTimestamp) / 1000))
      const nextPosition = tryMove(positionRef.current, vector, deltaSeconds)

      lastTimestampRef.current = timestamp
      positionRef.current = nextPosition
      setSourcePosition(nextPosition)
      setDirection((current) => directionFromVector(vector, current))
      setIsMoving(true)
      animationRef.current = window.requestAnimationFrame(tick)
    },
    [enabled, stopAnimation, tryMove],
  )

  const ensureAnimation = useCallback(() => {
    if (!enabled || animationRef.current) return

    animationRef.current = window.requestAnimationFrame(tick)
  }, [enabled, tick])

  const setDirectionHeld = useCallback(
    (directionToHold: HeldDirection, held: boolean) => {
      if (!enabled) return

      if (held) {
        heldDirectionsRef.current.add(directionToHold)
        ensureAnimation()
      } else {
        heldDirectionsRef.current.delete(directionToHold)
      }
    },
    [enabled, ensureAnimation],
  )

  useEffect(() => {
    if (enabled) return

    heldDirectionsRef.current.clear()
    stopAnimation()
  }, [enabled, stopAnimation])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || isEditableTarget(event.target)) return

      const directionToHold = keyToDirection[event.key]
      if (!directionToHold) return

      event.preventDefault()
      heldDirectionsRef.current.add(directionToHold)
      ensureAnimation()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const directionToHold = keyToDirection[event.key]
      if (!directionToHold) return

      heldDirectionsRef.current.delete(directionToHold)
    }

    const clearHeldDirections = () => {
      heldDirectionsRef.current.clear()
      stopAnimation()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') clearHeldDirections()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearHeldDirections)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearHeldDirections)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, ensureAnimation, stopAnimation])

  useEffect(() => {
    positionRef.current = sourcePosition
  }, [sourcePosition])

  useEffect(() => stopAnimation, [stopAnimation])

  return {
    direction,
    isMoving,
    renderPosition,
    setDirectionHeld,
    sourcePosition,
  }
}
