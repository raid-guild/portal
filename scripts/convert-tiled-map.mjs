import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const defaultInput = 'public/assets/map/maps/adventure/adventure.tiled.json'
const defaultOutput = 'public/assets/map/maps/adventure/map.json'

const inputPath = process.argv[2] || defaultInput
const outputPath = process.argv[3] || defaultOutput
const walkableExpansionPixels = 20

const round = (value) => Math.round(value * 100) / 100
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const propertiesToObject = (properties = []) =>
  Object.fromEntries(properties.map((property) => [property.name, property.value]))

const requireLayer = (map, name) => {
  const layer = map.layers?.find((candidate) => candidate.name === name)

  if (!layer) {
    throw new Error(`Missing required Tiled layer: ${name}`)
  }

  return layer
}

const expandPolygon = (points, pixels) => {
  if (!pixels) return points

  const center = points.reduce(
    (sum, point) => ({
      x: sum.x + point[0],
      y: sum.y + point[1],
    }),
    { x: 0, y: 0 },
  )
  center.x /= points.length
  center.y /= points.length

  return points.map(([x, y]) => {
    const dx = x - center.x
    const dy = y - center.y
    const length = Math.hypot(dx, dy) || 1

    return [x + (dx / length) * pixels, y + (dy / length) * pixels]
  })
}

const absolutePolygon = (object, size, expansionPixels = 0) => {
  if (!Array.isArray(object.polygon) || object.polygon.length < 3) {
    throw new Error(`Object "${object.name}" must be a polygon with at least 3 points.`)
  }

  const absolutePoints = object.polygon.map((point) => [object.x + point.x, object.y + point.y])

  return expandPolygon(absolutePoints, expansionPixels).map(([x, y]) => [
    round(clamp(x, 0, size.w)),
    round(clamp(y, 0, size.h)),
  ])
}

const pointForObject = (object) => {
  if (object.point) return { x: round(object.x), y: round(object.y) }

  if (object.ellipse || object.width || object.height) {
    return {
      x: round(object.x + object.width / 2),
      y: round(object.y + object.height / 2),
    }
  }

  return { x: round(object.x), y: round(object.y) }
}

const boundsForObject = (object) => {
  if (!object.width && !object.height) return undefined

  return {
    h: round(object.height || 0),
    w: round(object.width || 0),
    x: round(object.x),
    y: round(object.y),
  }
}

const convert = (tiledMap) => {
  const mapProperties = propertiesToObject(tiledMap.properties)
  const sourceWidth = Number(mapProperties.sourceWidth || tiledMap.width * tiledMap.tilewidth)
  const sourceHeight = Number(mapProperties.sourceHeight || tiledMap.height * tiledMap.tileheight)
  const spawnLayer = requireLayer(tiledMap, 'spawn')
  const walkableLayer = requireLayer(tiledMap, 'walkable')
  const blockedLayer = requireLayer(tiledMap, 'blocked')
  const poiLayer = requireLayer(tiledMap, 'pointsOfInterest')
  const spawnObject = spawnLayer.objects?.[0]

  if (!spawnObject) {
    throw new Error('The spawn layer must include a default spawn point.')
  }

  const spawnProperties = propertiesToObject(spawnObject.properties)
  const spawnPoint = pointForObject(spawnObject)

  return {
    background:
      mapProperties.backgroundPath || '/assets/map/backgrounds/adventure-map-background.webp',
    movement: {
      blocked: (blockedLayer.objects || []).map((object) => {
        const properties = propertiesToObject(object.properties)

        return {
          id: String(properties.obstacleId || object.name),
          points: absolutePolygon(object, { h: sourceHeight, w: sourceWidth }),
        }
      }),
      kind: String(mapProperties.movementKind || 'navmesh'),
      walkable: (walkableLayer.objects || []).map((object) => {
        const properties = propertiesToObject(object.properties)

        return {
          id: String(properties.navmeshId || object.name),
          movementCost: Number(properties.movementCost || 1),
          points: absolutePolygon(
            object,
            { h: sourceHeight, w: sourceWidth },
            walkableExpansionPixels,
          ),
        }
      }),
    },
    pointsOfInterest: (poiLayer.objects || []).map((object) => {
      const properties = propertiesToObject(object.properties)
      const point = pointForObject(object)
      const triggerBounds = boundsForObject(object)

      return {
        actionLabel: String(properties.actionLabel || ''),
        dialogKey: String(properties.dialogKey || properties.locationId || object.name),
        enabled: properties.enabled !== false,
        href: String(properties.href || ''),
        id: String(properties.locationId || object.name),
        kind: String(properties.kind || 'static'),
        label: String(properties.label || object.name),
        markerRadius: Number(properties.markerRadius || 36),
        menuOrder: Number(properties.menuOrder || 100),
        nodeId: String(properties.nodeId || ''),
        opensDialog: properties.opensDialog !== false,
        region: String(properties.region || ''),
        triggerBounds,
        triggerRadius: Number(properties.triggerRadius || 72),
        triggerShape: String(properties.triggerShape || (object.ellipse ? 'ellipse' : 'circle')),
        x: point.x,
        y: point.y,
      }
    }),
    schema: String(mapProperties.schema || 'portal-map-v1'),
    schemaVersion: Number(mapProperties.schemaVersion || 1),
    size: {
      h: sourceHeight,
      w: sourceWidth,
    },
    spawn: {
      characterFootRadius: Number(spawnProperties.characterFootRadius || 6),
      facing: String(spawnProperties.facing || 'down'),
      id: String(spawnProperties.spawnId || spawnObject.name || 'default'),
      x: spawnPoint.x,
      y: spawnPoint.y,
    },
  }
}

const main = async () => {
  const input = JSON.parse(await readFile(inputPath, 'utf8'))
  const manifest = convert(input)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Wrote ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
