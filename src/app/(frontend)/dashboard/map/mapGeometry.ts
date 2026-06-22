import type { MapManifest, MapManifestPointOfInterest, MapPixelPoint, MapPolygon } from './mapManifest'

export const toPercentPoint = (point: MapPixelPoint, size: MapManifest['size']) => ({
  x: (point.x / size.w) * 100,
  y: (point.y / size.h) * 100,
})

export const clampPointToMap = (point: MapPixelPoint, size: MapManifest['size']): MapPixelPoint => ({
  x: Math.min(size.w, Math.max(0, point.x)),
  y: Math.min(size.h, Math.max(0, point.y)),
})

export const pointInPolygon = (point: MapPixelPoint, polygon: MapPolygon): boolean => {
  let inside = false

  for (let i = 0, j = polygon.points.length - 1; i < polygon.points.length; j = i++) {
    const [xi, yi] = polygon.points[i]
    const [xj, yj] = polygon.points[j]
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

const distanceToSegment = (
  point: MapPixelPoint,
  start: [number, number],
  end: [number, number],
): number => {
  const [x1, y1] = start
  const [x2, y2] = end
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) return Math.hypot(point.x - x1, point.y - y1)

  const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lengthSquared))
  const projectionX = x1 + t * dx
  const projectionY = y1 + t * dy

  return Math.hypot(point.x - projectionX, point.y - projectionY)
}

const distanceToPolygonEdges = (point: MapPixelPoint, polygon: MapPolygon): number => {
  let closest = Number.POSITIVE_INFINITY

  for (let i = 0; i < polygon.points.length; i += 1) {
    const start = polygon.points[i]
    const end = polygon.points[(i + 1) % polygon.points.length]
    closest = Math.min(closest, distanceToSegment(point, start, end))
  }

  return closest
}

const circleInsidePolygon = (
  point: MapPixelPoint,
  polygon: MapPolygon,
  radius: number,
): boolean => pointInPolygon(point, polygon) && distanceToPolygonEdges(point, polygon) >= radius

const circleIntersectsPolygon = (
  point: MapPixelPoint,
  polygon: MapPolygon,
  radius: number,
): boolean => pointInPolygon(point, polygon) || distanceToPolygonEdges(point, polygon) <= radius

export const canStandAtPoint = (
  manifest: MapManifest,
  point: MapPixelPoint,
  radius = manifest.spawn.characterFootRadius,
): boolean => {
  const clamped = clampPointToMap(point, manifest.size)

  if (clamped.x !== point.x || clamped.y !== point.y) return false

  const isInsideWalkable = manifest.movement.walkable.some((polygon) =>
    circleInsidePolygon(point, polygon, radius),
  )

  if (!isInsideWalkable) return false

  return !manifest.movement.blocked.some((polygon) => circleIntersectsPolygon(point, polygon, radius))
}

export const isPointInPOITrigger = (
  point: MapPixelPoint,
  poi: MapManifestPointOfInterest,
): boolean => {
  if (poi.triggerShape === 'ellipse' && poi.triggerBounds?.w && poi.triggerBounds?.h) {
    const radiusX = poi.triggerBounds.w / 2
    const radiusY = poi.triggerBounds.h / 2
    const normalizedX = (point.x - poi.x) / radiusX
    const normalizedY = (point.y - poi.y) / radiusY

    return normalizedX * normalizedX + normalizedY * normalizedY <= 1
  }

  return Math.hypot(point.x - poi.x, point.y - poi.y) <= poi.triggerRadius
}

export const getNearestTriggeredPOI = (
  point: MapPixelPoint,
  pois: MapManifestPointOfInterest[],
): MapManifestPointOfInterest | null => {
  const triggered = pois
    .filter((poi) => poi.enabled && poi.opensDialog && isPointInPOITrigger(point, poi))
    .map((poi) => ({
      distance: Math.hypot(point.x - poi.x, point.y - poi.y),
      poi,
    }))
    .sort((a, b) => a.distance - b.distance)

  return triggered[0]?.poi || null
}
