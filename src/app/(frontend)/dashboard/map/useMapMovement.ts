'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  findPath,
  mapNodes,
  type MapNodeID,
  type MapPoint,
  mapSpawnPoint,
  type SpriteDirection,
} from './mapConfig'

const speedPercentPerSecond = 30

export const useMapMovement = () => {
  const [currentNodeID, setCurrentNodeID] = useState<MapNodeID>('spawn')
  const [direction, setDirection] = useState<SpriteDirection>('down')
  const [isMoving, setIsMoving] = useState(false)
  const [position, setPosition] = useState<MapPoint>(mapSpawnPoint)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)

    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const travelTo = useCallback(
    (destinationNodeID: MapNodeID, onArrive?: () => void) => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)

      const path = findPath(currentNodeID, destinationNodeID)
      const destination = mapNodes[destinationNodeID]

      if (prefersReducedMotion || path.length <= 1) {
        setPosition({ x: destination.x, y: destination.y })
        setCurrentNodeID(destinationNodeID)
        setIsMoving(false)
        onArrive?.()
        return
      }

      setIsMoving(true)

      let segmentIndex = 0
      let segmentStartTime: number | null = null
      let from = { ...position }
      let to = mapNodes[path[1]]
      const setFacing = (start: MapPoint, end: MapPoint) => {
        const dx = end.x - start.x
        const dy = end.y - start.y

        if (Math.abs(dx) > Math.abs(dy)) {
          setDirection(dx >= 0 ? 'right' : 'left')
        } else {
          setDirection(dy >= 0 ? 'down' : 'up')
        }
      }

      setFacing(from, to)

      const tick = (timestamp: number) => {
        if (segmentStartTime == null) segmentStartTime = timestamp

        const distance = Math.hypot(to.x - from.x, to.y - from.y)
        const duration = Math.max(220, (distance / speedPercentPerSecond) * 1000)
        const progress = Math.min(1, (timestamp - segmentStartTime) / duration)
        const nextPosition = {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        }

        setPosition(nextPosition)

        if (progress < 1) {
          animationRef.current = window.requestAnimationFrame(tick)
          return
        }

        segmentIndex += 1
        const nextNodeID = path[segmentIndex + 1]

        if (!nextNodeID) {
          setCurrentNodeID(destinationNodeID)
          setIsMoving(false)
          setPosition({ x: destination.x, y: destination.y })
          onArrive?.()
          return
        }

        from = { x: to.x, y: to.y }
        to = mapNodes[nextNodeID]
        segmentStartTime = timestamp
        setFacing(from, to)
        animationRef.current = window.requestAnimationFrame(tick)
      }

      animationRef.current = window.requestAnimationFrame(tick)
    },
    [currentNodeID, position, prefersReducedMotion],
  )

  return {
    currentNodeID,
    direction,
    isMoving,
    position,
    travelTo,
  }
}

