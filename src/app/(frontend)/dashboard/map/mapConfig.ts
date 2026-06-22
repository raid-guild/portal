import { toPercentPoint } from './mapGeometry'
import { mapManifest } from './mapManifest'

export type MapLocationID =
  | 'slop-swamp'
  | 'lava-castle'
  | 'forest-knowledge'
  | 'village'
  | 'guild-castle'
  | 'whispers-hut'
  | 'lunker-lake'

export type MapNodeID =
  | 'spawn'
  | 'south-road'
  | 'swamp'
  | 'lake'
  | 'forest'
  | 'hut'
  | 'mine'
  | 'village'
  | 'lava-road'
  | 'lava-castle'

export type MapPoint = {
  x: number
  y: number
}

export type MapNode = MapPoint & {
  id: MapNodeID
  links: MapNodeID[]
}

export type MapLocationConfig = MapPoint & {
  actionHref?: string
  actionLabel?: string
  disabled?: boolean
  id: MapLocationID
  label: string
  nodeID: MapNodeID
  region: string
}

export type SpriteDirection = 'down' | 'up' | 'left' | 'right'

export const mapBackgroundPath = mapManifest.background

export const mapSpawnPoint: MapPoint = toPercentPoint(mapManifest.spawn, mapManifest.size)

export const roleSpriteAliases: Record<string, string> = {
  'angry-dwarf': 'dwarf',
  'mystic-alchemist': 'alchemist',
  'tavern-keeper': 'tavern-keeper',
}

export const availableSpriteSlugs = [
  'alchemist',
  'archer',
  'cleric',
  'druid',
  'dwarf',
  'healer',
  'hunter',
  'monk',
  'necromancer',
  'paladin',
  'ranger',
  'rogue',
  'scribe',
  'tavern-keeper',
  'warrior',
  'wizard',
] as const

export const missingArtRoleSlugs = ['apprentice', 'bard'] as const

export const mapNodes: Record<MapNodeID, MapNode> = {
  forest: {
    id: 'forest',
    links: ['hut', 'lake', 'mine'],
    x: 33,
    y: 23,
  },
  hut: {
    id: 'hut',
    links: ['forest', 'lake', 'spawn'],
    x: 29,
    y: 34,
  },
  lake: {
    id: 'lake',
    links: ['forest', 'hut', 'south-road'],
    x: 12,
    y: 40,
  },
  'lava-castle': {
    id: 'lava-castle',
    links: ['lava-road'],
    x: 91,
    y: 51,
  },
  'lava-road': {
    id: 'lava-road',
    links: ['lava-castle', 'mine', 'village'],
    x: 74,
    y: 58,
  },
  mine: {
    id: 'mine',
    links: ['forest', 'lava-road', 'spawn'],
    x: 51,
    y: 54,
  },
  spawn: {
    id: 'spawn',
    links: ['hut', 'mine', 'south-road', 'village'],
    ...mapSpawnPoint,
  },
  'south-road': {
    id: 'south-road',
    links: ['lake', 'spawn', 'swamp', 'village'],
    x: 34,
    y: 73,
  },
  swamp: {
    id: 'swamp',
    links: ['south-road'],
    x: 18,
    y: 75,
  },
  village: {
    id: 'village',
    links: ['lava-road', 'south-road', 'spawn'],
    x: 51,
    y: 78,
  },
}

const mapLocationIDs = new Set<MapLocationID>([
  'forest-knowledge',
  'guild-castle',
  'lava-castle',
  'lunker-lake',
  'slop-swamp',
  'village',
  'whispers-hut',
])

const mapNodeIDs = new Set<MapNodeID>([
  'forest',
  'hut',
  'lake',
  'lava-castle',
  'lava-road',
  'mine',
  'south-road',
  'spawn',
  'swamp',
  'village',
])

const isMapLocationID = (value: string): value is MapLocationID =>
  mapLocationIDs.has(value as MapLocationID)

const toMapNodeID = (value: string): MapNodeID =>
  mapNodeIDs.has(value as MapNodeID) ? (value as MapNodeID) : 'spawn'

export const mapLocations: MapLocationConfig[] = mapManifest.pointsOfInterest
  .filter((poi) => isMapLocationID(poi.id))
  .sort((a, b) => a.menuOrder - b.menuOrder)
  .map((poi) => {
    const id = poi.id as MapLocationID
    const point = toPercentPoint(poi, mapManifest.size)

    return {
      actionHref: poi.href || undefined,
      actionLabel: poi.actionLabel || undefined,
      disabled: !poi.enabled,
      id,
      label: poi.label,
      nodeID: toMapNodeID(poi.nodeId),
      region: poi.region,
      x: point.x,
      y: point.y,
    }
  })

export const findPath = (from: MapNodeID, to: MapNodeID): MapNodeID[] => {
  if (from === to) return [from]

  const queue: MapNodeID[][] = [[from]]
  const visited = new Set<MapNodeID>([from])

  while (queue.length) {
    const path = queue.shift()
    const current = path?.[path.length - 1]
    if (!path || !current) continue

    for (const next of mapNodes[current].links) {
      if (visited.has(next)) continue

      const nextPath = [...path, next]
      if (next === to) return nextPath

      visited.add(next)
      queue.push(nextPath)
    }
  }

  return [from, to]
}
