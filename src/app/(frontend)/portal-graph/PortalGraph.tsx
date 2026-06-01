'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as React.ComponentType<Record<string, unknown>>

type MatchingProfile = {
  handle: string
  id: number | string
  label: string
  profileHref: string
}

type RoleNode = {
  description?: string
  id: `role:${string}`
  label: string
  matchingProfiles: MatchingProfile[]
  profileCount: number
  type: 'role'
}

type SkillNode = {
  description?: string
  id: `skill:${string}`
  label: string
  matchingProfiles: MatchingProfile[]
  profileCount: number
  type: 'skill'
}

type ProfileNode = {
  avatarURL?: string
  bio: string
  handle: string
  id: `profile:${string}`
  label: string
  profileHref: string
  roles: string[]
  skills: string[]
  type: 'profile'
}

export type ExplorerNode = RoleNode | SkillNode | ProfileNode

export type ExplorerGraphData = {
  links: {
    source: string
    target: string
    type: 'hasRole' | 'hasSkill'
  }[]
  nodes: ExplorerNode[]
}

type RuntimeLink = ExplorerGraphData['links'][number] & {
  source: string | ExplorerNode
  target: string | ExplorerNode
}

const nodeColors: Record<ExplorerNode['type'], string> = {
  profile: '#F7EFE0',
  role: '#B95B47',
  skill: '#E0B15F',
}

export const PortalGraph: React.FC<{ data: ExplorerGraphData }> = ({ data }) => {
  const [activeTypes, setActiveTypes] = useState<Record<ExplorerNode['type'], boolean>>({
    profile: true,
    role: true,
    skill: true,
  })
  const [dimensions, setDimensions] = useState({ height: 620, width: 960 })
  const [query, setQuery] = useState('')
  const [selectedID, setSelectedID] = useState<string | null>(null)
  const [hoveredID, setHoveredID] = useState<string | null>(null)
  const graphRef = useRef<any>(null)
  const hasInitialViewRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const resize = () => {
      const width = Math.max(320, wrapper.clientWidth)
      setDimensions({
        height: width < 640 ? 520 : width < 960 ? 680 : 820,
        width,
      })
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [])

  const connectedIDs = useMemo(
    () => getConnectedIDs(data, selectedID || hoveredID),
    [data, hoveredID, selectedID],
  )

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const visibleNodeIDs = new Set<string>()

    for (const node of data.nodes) {
      const matchesType = activeTypes[node.type]
      const matchesQuery =
        !normalizedQuery ||
        node.label.toLowerCase().includes(normalizedQuery) ||
        (node.type === 'profile' && node.handle.toLowerCase().includes(normalizedQuery))

      if (matchesType && matchesQuery) visibleNodeIDs.add(node.id)
    }

    if (normalizedQuery) {
      for (const link of data.links) {
        const sourceID = link.source
        const targetID = link.target
        if (visibleNodeIDs.has(sourceID) || visibleNodeIDs.has(targetID)) {
          if (activeTypes[data.nodes.find((node) => node.id === sourceID)?.type || 'profile']) {
            visibleNodeIDs.add(sourceID)
          }
          if (activeTypes[data.nodes.find((node) => node.id === targetID)?.type || 'profile']) {
            visibleNodeIDs.add(targetID)
          }
        }
      }
    }

    const nodes = data.nodes.filter((node) => visibleNodeIDs.has(node.id))
    const links = data.links.filter(
      (link) => visibleNodeIDs.has(link.source) && visibleNodeIDs.has(link.target),
    )

    return {
      links: links.map((link) => ({ ...link })),
      nodes: nodes.map((node) => ({
        ...node,
        ...initialNodePosition(node),
      })),
    }
  }, [activeTypes, data, query])

  const selectedNode = data.nodes.find((node) => node.id === selectedID) || null
  const activeID = selectedID || hoveredID

  useEffect(() => {
    const graph = graphRef.current
    if (!graph?.d3Force) return

    graph.d3Force('charge')?.strength?.(-220)
    graph.d3Force('link')?.distance?.((link: RuntimeLink) => (link.type === 'hasRole' ? 145 : 120))
    graph.d3Force('center')?.strength?.(0.025)
    graph.d3ReheatSimulation?.()

    if (!hasInitialViewRef.current) {
      const firstFit = window.setTimeout(() => fitGraph(500), 500)
      const settledFit = window.setTimeout(() => {
        fitGraph(700)
        hasInitialViewRef.current = true
      }, 1800)

      return () => {
        window.clearTimeout(firstFit)
        window.clearTimeout(settledFit)
      }
    }
  }, [filteredData.links.length, filteredData.nodes.length])

  const fitGraph = (duration = 700) => {
    const graph = graphRef.current
    if (!graph?.zoomToFit) return

    graph.zoomToFit(duration, 64)
  }

  const focusSearchResult = () => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return

    const match = data.nodes.find(
      (node) =>
        activeTypes[node.type] &&
        (node.label.toLowerCase().includes(normalizedQuery) ||
          (node.type === 'profile' && node.handle.toLowerCase().includes(normalizedQuery))),
    )

    if (!match) return

    setSelectedID(match.id)
    const graph = graphRef.current
    if (graph?.centerAt && graph?.zoom) {
      const runtimeNode = filteredData.nodes.find((node) => node.id === match.id) as any
      if (runtimeNode?.x != null && runtimeNode?.y != null) {
        graph.centerAt(runtimeNode.x, runtimeNode.y, 600)
        graph.zoom(1.3, 600)
      }
    }
  }

  return (
    <section className="mt-10 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Search
            </span>
            <input
              className="h-11 border border-border bg-background/80 px-3 text-sm text-foreground outline-none focus:border-primary"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') focusSearchResult()
              }}
              placeholder="Find a role, skill, or profile"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="portal-admin-link" onClick={focusSearchResult} type="button">
              Focus
            </button>
            <button
              className="portal-admin-link"
              onClick={() => {
                setQuery('')
                setSelectedID(null)
                fitGraph(700)
              }}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {(['role', 'skill', 'profile'] as const).map((type) => (
            <button
              aria-pressed={!!activeTypes[type]}
              className={
                activeTypes[type]
                  ? 'portal-admin-link justify-center bg-primary text-primary-foreground'
                  : 'portal-admin-link justify-center'
              }
              key={type}
              onClick={() =>
                setActiveTypes((current) => ({
                  ...current,
                  [type]: !current[type],
                }))
              }
              type="button"
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>

        <div
          className="overflow-hidden border border-border bg-background"
          ref={wrapperRef}
          style={{ height: dimensions.height }}
        >
          <ForceGraph2D
            backgroundColor="rgba(10,10,9,1)"
            cooldownTicks={140}
            d3AlphaDecay={0.018}
            d3VelocityDecay={0.22}
            dagLevelDistance={80}
            graphData={filteredData}
            height={dimensions.height}
            linkColor={(link: RuntimeLink) =>
              isConnectedLink(link, activeID) ? 'rgba(224,177,95,0.85)' : 'rgba(247,239,224,0.18)'
            }
            linkDirectionalParticles={(link: RuntimeLink) =>
              isConnectedLink(link, activeID) ? 2 : 0
            }
            linkDirectionalParticleSpeed={0.004}
            linkWidth={(link: RuntimeLink) => (isConnectedLink(link, activeID) ? 2 : 0.6)}
            nodeCanvasObject={(
              node: ExplorerNode,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) =>
              drawNode({ activeID, connectedIDs, ctx, globalScale, hoveredID, node, selectedID })
            }
            nodeLabel={(node: ExplorerNode) => node.label}
            nodePointerAreaPaint={(
              node: ExplorerNode,
              color: string,
              ctx: CanvasRenderingContext2D,
            ) => {
              ctx.fillStyle = color
              ctx.beginPath()
              ctx.arc(
                (node as any).x || 0,
                (node as any).y || 0,
                nodeRadius(node) + 8,
                0,
                2 * Math.PI,
              )
              ctx.fill()
            }}
            onNodeClick={(node: ExplorerNode) => setSelectedID(node.id)}
            onNodeHover={(node: ExplorerNode | null) => setHoveredID(node?.id || null)}
            onZoom={() => {
              hasInitialViewRef.current = true
            }}
            ref={graphRef}
            warmupTicks={80}
            width={dimensions.width}
          />
        </div>
      </div>

      <ExplorerSidePanel node={selectedNode} />
    </section>
  )
}

const typeLabels: Record<ExplorerNode['type'], string> = {
  profile: 'Profiles',
  role: 'Roles',
  skill: 'Skills',
}

const ExplorerSidePanel: React.FC<{ node: ExplorerNode | null }> = ({ node }) => {
  if (!node) {
    return (
      <aside className="portal-panel 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto">
        <p className="portal-kicker">Selection</p>
        <h2 className="mt-2 portal-heading-sm">Choose a node</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Click a role, skill, or profile to inspect its connections.
        </p>
      </aside>
    )
  }

  if (node.type === 'profile') {
    return (
      <aside className="portal-panel 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto">
        <p className="portal-kicker">Profile</p>
        <div className="mt-4 flex items-center gap-4">
          <Avatar node={node} />
          <div className="min-w-0">
            <h2 className="portal-heading-sm">{node.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">@{node.handle}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">{node.bio}</p>
        <TaxonomyList items={node.roles} title="Roles" />
        <TaxonomyList items={node.skills} title="Skills" />
        <Link className="portal-admin-link mt-6 w-full justify-center" href={node.profileHref}>
          View profile
        </Link>
      </aside>
    )
  }

  return (
    <aside className="portal-panel 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto">
      <p className="portal-kicker">{node.type}</p>
      <h2 className="mt-2 portal-heading-sm">{node.label}</h2>
      {node.description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{node.description}</p>
      ) : null}
      <p className="mt-5 text-sm font-medium">
        {node.profileCount === 1
          ? '1 connected profile'
          : `${node.profileCount} connected profiles`}
      </p>
      {node.matchingProfiles.length ? (
        <div className="mt-5">
          <p className="portal-kicker">Matching profiles</p>
          <div className="mt-3 space-y-2">
            {node.matchingProfiles.slice(0, 8).map((profile) => (
              <Link
                className="block border border-border px-3 py-2 text-sm hover:border-primary"
                href={profile.profileHref}
                key={`${node.id}:${profile.id}`}
              >
                {profile.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

const TaxonomyList: React.FC<{ items: string[]; title: string }> = ({ items, title }) => {
  if (!items.length) return null

  return (
    <div className="mt-5">
      <p className="portal-kicker">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="portal-pill" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

const Avatar: React.FC<{ node: ProfileNode }> = ({ node }) => (
  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card/60">
    {node.avatarURL ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className="h-full w-full object-cover" src={node.avatarURL} />
    ) : (
      <span className="font-mono text-lg font-bold text-muted-foreground">
        {initials(node.label)}
      </span>
    )}
  </div>
)

const drawNode = ({
  activeID,
  connectedIDs,
  ctx,
  globalScale,
  hoveredID,
  node,
  selectedID,
}: {
  activeID: string | null
  connectedIDs: Set<string>
  ctx: CanvasRenderingContext2D
  globalScale: number
  hoveredID: string | null
  node: ExplorerNode
  selectedID: string | null
}) => {
  const x = (node as any).x || 0
  const y = (node as any).y || 0
  const radius = nodeRadius(node)
  const isSelected = node.id === selectedID
  const isHovered = node.id === hoveredID
  const isDimmed = activeID && !connectedIDs.has(node.id) && !isSelected && !isHovered

  ctx.save()
  ctx.globalAlpha = isDimmed ? 0.25 : 1
  ctx.beginPath()
  ctx.arc(x, y, radius + (isSelected || isHovered ? 5 : 0), 0, 2 * Math.PI)
  ctx.fillStyle = isSelected ? '#F7EFE0' : nodeColors[node.type]
  ctx.fill()
  ctx.lineWidth = isSelected || isHovered ? 3 : 1
  ctx.strokeStyle = isSelected || isHovered ? '#E0B15F' : 'rgba(247,239,224,0.35)'
  ctx.stroke()

  if (shouldDrawLabel({ isHovered, isSelected })) {
    const label = node.label
    const fontSize = Math.max(8, Math.min(13, 12 / globalScale))
    ctx.font = `700 ${fontSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = isDimmed ? 'rgba(247,239,224,0.45)' : '#F7EFE0'
    ctx.fillText(label, x, y + radius + 5 / globalScale)
  }

  ctx.restore()
}

const shouldDrawLabel = ({
  isHovered,
  isSelected,
}: {
  isHovered: boolean
  isSelected: boolean
}) => {
  if (isSelected || isHovered) return true
  return false
}

const getConnectedIDs = (data: ExplorerGraphData, activeID: string | null) => {
  const connected = new Set<string>()
  if (!activeID) return connected

  connected.add(activeID)

  for (const link of data.links) {
    if (link.source === activeID) connected.add(link.target)
    if (link.target === activeID) connected.add(link.source)
  }

  return connected
}

const isConnectedLink = (link: RuntimeLink, activeID: string | null) => {
  if (!activeID) return false

  return nodeID(link.source) === activeID || nodeID(link.target) === activeID
}

const nodeID = (node: string | ExplorerNode) => (typeof node === 'string' ? node : node.id)

const initialNodePosition = (node: ExplorerNode) => {
  const seed = hashString(node.id)
  const angle = (seed % 360) * (Math.PI / 180)
  const ringOffset = ((seed >> 4) % 100) / 100
  const typeRadius =
    node.type === 'role'
      ? 320 + ringOffset * 120
      : node.type === 'skill'
        ? 230 + ringOffset * 110
        : 120 + ringOffset * 180

  return {
    x: Math.cos(angle) * typeRadius,
    y: Math.sin(angle) * typeRadius,
  }
}

const nodeRadius = (node: ExplorerNode) => {
  if (node.type === 'role') return 10 + Math.min(node.profileCount * 0.35, 8)
  if (node.type === 'skill') return 8 + Math.min(node.profileCount * 0.28, 6)

  return 4
}

const hashString = (value: string) => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'RG'
