import { access, readFile } from 'node:fs/promises'
import process from 'node:process'

const defaultInput = 'public/assets/map/maps/adventure/map.json'
const inputPath = process.argv[2] || defaultInput

const mapLocationIds = new Set([
  'forest-knowledge',
  'guild-castle',
  'lava-castle',
  'lunker-lake',
  'slop-swamp',
  'village',
  'whispers-hut',
])

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const pointInPolygon = (point, polygon) => {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

const validatePolygon = (polygon, label, manifest) => {
  assert(Array.isArray(polygon), `${label} must be an array of points.`)
  assert(polygon.length >= 3, `${label} must have at least 3 points.`)

  for (const point of polygon) {
    assert(Array.isArray(point) && point.length === 2, `${label} has an invalid point.`)
    const [x, y] = point
    assert(Number.isFinite(x) && Number.isFinite(y), `${label} has a non-numeric point.`)
    assert(x >= -1 && x <= manifest.size.w + 1, `${label} has x outside source bounds.`)
    assert(y >= -1 && y <= manifest.size.h + 1, `${label} has y outside source bounds.`)
  }
}

const validate = async (manifest) => {
  assert(manifest.schema === 'portal-map-v1', 'Expected schema portal-map-v1.')
  assert(manifest.schemaVersion === 1, 'Expected schemaVersion 1.')
  assert(manifest.size?.w === 1920, 'Expected source width 1920.')
  assert(manifest.size?.h === 1080, 'Expected source height 1080.')
  assert(typeof manifest.background === 'string' && manifest.background, 'Missing background path.')

  await access(`public${manifest.background}`)

  assert(manifest.spawn?.id === 'default', 'Expected one default spawn.')
  assert(Number.isFinite(manifest.spawn.x), 'Spawn x must be numeric.')
  assert(Number.isFinite(manifest.spawn.y), 'Spawn y must be numeric.')
  assert(
    Number.isFinite(manifest.spawn.characterFootRadius) &&
      manifest.spawn.characterFootRadius > 0,
    'Spawn characterFootRadius must be positive.',
  )

  const walkable = manifest.movement?.walkable || []
  const blocked = manifest.movement?.blocked || []

  assert(manifest.movement?.kind === 'navmesh', 'Expected navmesh movement.')
  assert(walkable.length > 0, 'At least one walkable polygon is required.')

  for (const polygon of walkable) {
    assert(polygon.id, 'Every walkable polygon needs an id.')
    validatePolygon(polygon.points, `walkable:${polygon.id}`, manifest)
  }

  for (const polygon of blocked) {
    assert(polygon.id, 'Every blocked polygon needs an id.')
    validatePolygon(polygon.points, `blocked:${polygon.id}`, manifest)
  }

  const spawnPoint = { x: manifest.spawn.x, y: manifest.spawn.y }
  assert(
    walkable.some((polygon) => pointInPolygon(spawnPoint, polygon.points)),
    'Default spawn must be inside a walkable polygon.',
  )
  assert(
    !blocked.some((polygon) => pointInPolygon(spawnPoint, polygon.points)),
    'Default spawn must be outside blocked polygons.',
  )

  for (const poi of manifest.pointsOfInterest || []) {
    assert(poi.id, 'Every POI needs an id.')
    assert(poi.label, `POI ${poi.id} needs a label.`)
    assert(poi.kind, `POI ${poi.id} needs a kind.`)
    assert(poi.dialogKey, `POI ${poi.id} needs a dialogKey.`)
    assert(Number.isFinite(poi.x) && Number.isFinite(poi.y), `POI ${poi.id} needs coordinates.`)
    assert(Number.isFinite(poi.triggerRadius), `POI ${poi.id} needs a triggerRadius.`)
    assert(Number.isFinite(poi.markerRadius), `POI ${poi.id} needs a markerRadius.`)

    if (poi.enabled) {
      assert(mapLocationIds.has(poi.id), `Enabled POI ${poi.id} is not a map dialog id.`)
    }
  }
}

const main = async () => {
  const manifest = JSON.parse(await readFile(inputPath, 'utf8'))
  await validate(manifest)
  console.log(`Validated ${inputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
