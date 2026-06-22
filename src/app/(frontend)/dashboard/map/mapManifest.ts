import manifest from '../../../../../public/assets/map/maps/adventure/map.json'

export type MapPixelPoint = {
  x: number
  y: number
}

export type MapPolygon = {
  id: string
  movementCost?: number
  points: Array<[number, number]>
}

export type MapManifestPointOfInterest = MapPixelPoint & {
  actionLabel: string
  dialogKey: string
  enabled: boolean
  href: string
  id: string
  kind: string
  label: string
  markerRadius: number
  menuOrder: number
  nodeId: string
  opensDialog: boolean
  region: string
  triggerBounds?: {
    h: number
    w: number
    x: number
    y: number
  }
  triggerRadius: number
  triggerShape: string
}

export type MapManifest = {
  background: string
  movement: {
    blocked: MapPolygon[]
    kind: 'navmesh'
    walkable: MapPolygon[]
  }
  pointsOfInterest: MapManifestPointOfInterest[]
  schema: 'portal-map-v1'
  schemaVersion: 1
  size: {
    h: number
    w: number
  }
  spawn: MapPixelPoint & {
    characterFootRadius: number
    facing: 'down' | 'left' | 'right' | 'up'
    id: string
  }
}

export const mapManifest = manifest as MapManifest
