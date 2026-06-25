'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  CalendarDays,
  ExternalLink,
  Focus,
  GitBranch,
  Loader2,
  Maximize2,
  RotateCcw,
  Search,
  Sparkles,
  StepBack,
  UploadCloud,
  X,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { WikiArticleGenerateControl } from '../_components/WikiArticleGenerateControl'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as React.ComponentType<Record<string, unknown>>

type TopicGraphNode = {
  articleCount: number
  confidence: 'low' | 'medium' | 'high'
  id: `topic:${number}`
  kind: 'category' | 'topic' | 'subtopic' | 'possible'
  label: string
  lastExpandedAt?: string | null
  lastReviewedAt?: string | null
  reviewStatus: 'seed' | 'suggested' | 'needs_review' | 'reviewed' | 'archived'
  sourceSessions: SessionRef[]
  slug?: string | null
  sourceCount: number
  summary?: string | null
  type: 'category' | 'topic' | 'possible'
  visibility: 'public' | 'authenticated' | 'member' | 'admin'
}

type ArticleGraphNode = {
  bodySections: string[]
  bodyText: string
  confidence: 'low' | 'medium' | 'high'
  discoveryLinks: ArticleDiscoveryLinks
  href: string | null
  id: `article:${number}`
  label: string
  lastReviewedAt?: string | null
  lastRefreshedAt?: string | null
  reviewStatus: 'generated_draft' | 'needs_review' | 'reviewed' | 'needs_refresh' | 'archived'
  sourceSessions: SessionRef[]
  slug?: string | null
  sourceCount: number
  status?: 'draft' | 'published' | null
  summary: string
  type: 'article'
  visibility: 'public' | 'authenticated' | 'member' | 'admin'
}

type SourceGraphNode = {
  artifactID?: string | null
  id: `source:${string}`
  label: string
  observedAt?: string | null
  sourceType: string
  sourceURL?: string | null
  type: 'source'
}

export type WikiExplorerNode = TopicGraphNode | ArticleGraphNode | SourceGraphNode

type SessionRef = {
  id: number
  title: string
}

type DiscoveryLink = {
  label: string
  note?: string | null
  url?: string | null
}

type ArticleDiscoveryLinks = {
  furtherReading: DiscoveryLink[]
  papers: DiscoveryLink[]
  tools: DiscoveryLink[]
}

type TopicMapSession = SessionRef & {
  resources: {
    label: string
    type: string
    url: string
  }[]
  startsAt?: string | null
  visibility: 'public' | 'authenticated' | 'member' | 'admin'
}

export type WikiExplorerGraphData = {
  links: {
    source: string
    target: string
    type: 'contains' | 'relates_to' | 'has_article' | 'has_source'
  }[]
  nodes: WikiExplorerNode[]
}

type RuntimeLink = Omit<WikiExplorerGraphData['links'][number], 'source' | 'target'> & {
  source: string | { id: string }
  target: string | { id: string }
}

const nodeColors: Record<WikiExplorerNode['type'], string> = {
  article: '#F7EFE0',
  category: '#B95B47',
  possible: '#7C8A5B',
  source: '#6F8FAF',
  topic: '#E0B15F',
}

export const WikiGraphExplorer: React.FC<{
  canManageWiki: boolean
  data: WikiExplorerGraphData
}> = ({ canManageWiki, data }) => {
  const [activeTypes, setActiveTypes] = useState<Record<WikiExplorerNode['type'], boolean>>({
    article: true,
    category: true,
    possible: true,
    source: true,
    topic: true,
  })
  const [dimensions, setDimensions] = useState({ height: 640, width: 960 })
  const [query, setQuery] = useState('')
  const [focusedID, setFocusedID] = useState<string | null>(() => initialTopicNodeID())
  const [importEventID, setImportEventID] = useState(() => initialSessionID())
  const [importResourceURL, setImportResourceURL] = useState('')
  const [importStatus, setImportStatus] = useState<{
    message: string
    tone: 'error' | 'success'
  } | null>(null)
  const [expansionStatus, setExpansionStatus] = useState<{
    message: string
    nodeID: string
    requestNumber?: number | null
    requestURL?: string | null
    tone: 'error' | 'success'
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importingExpansionNodeID, setImportingExpansionNodeID] = useState<string | null>(null)
  const [expandingNodeID, setExpandingNodeID] = useState<string | null>(null)
  const [selectedID, setSelectedID] = useState<string | null>(() => initialTopicNodeID())
  const [hoveredID, setHoveredID] = useState<string | null>(null)
  const [sourceSessionFilter, setSourceSessionFilter] = useState(() => initialSessionID())
  const [topicMapSessions, setTopicMapSessions] = useState<TopicMapSession[]>([])
  const graphRef = useRef<any>(null)
  const hasInitialViewRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const resize = () => {
      const width = Math.max(320, wrapper.clientWidth)
      setDimensions({
        height: width < 640 ? 540 : width < 960 ? 700 : 820,
        width,
      })
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const storedStatus = window.sessionStorage.getItem('wikiTopicMapImportStatus')
    if (storedStatus) {
      window.sessionStorage.removeItem('wikiTopicMapImportStatus')
      setImportStatus({
        message: storedStatus,
        tone: 'success',
      })
    }
  }, [])

  useEffect(() => {
    const initialTopic = initialTopicNodeID()
    if (!initialTopic || !data.nodes.some((node) => node.id === initialTopic)) return

    setFocusedID(initialTopic)
    setSelectedID(initialTopic)
    window.setTimeout(() => fitGraph(650), 150)
  }, [data.nodes])

  useEffect(() => {
    let cancelled = false

    const loadSessions = async () => {
      const response = await fetch('/api/wiki/topic-map/sessions')
      if (!response.ok) return

      const result = await response.json().catch(() => null)
      if (cancelled) return

      const sessions = Array.isArray(result?.sessions) ? result.sessions : []
      setTopicMapSessions(sessions)

      if (!importEventID && sessions[0]) {
        setImportEventID(String(sessions[0].id))
      }
    }

    loadSessions()

    return () => {
      cancelled = true
    }
  }, [importEventID])

  const selectedImportSession = topicMapSessions.find(
    (session) => String(session.id) === importEventID,
  )
  const selectedImportResource =
    selectedImportSession?.resources.find((resource) => resource.url === importResourceURL) ||
    selectedImportSession?.resources[0] ||
    null

  useEffect(() => {
    if (!selectedImportSession) return
    if (selectedImportResource && importResourceURL === selectedImportResource.url) return

    setImportResourceURL(selectedImportSession.resources[0]?.url || '')
  }, [importResourceURL, selectedImportResource, selectedImportSession])

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const scopedNodeIDs = getScopedNodeIDs(data, focusedID)
    const sessionScopedNodeIDs = getSessionScopedNodeIDs(data, sourceSessionFilter)
    const visibleNodeIDs = new Set<string>()
    const nodeTypes = new Map<string, WikiExplorerNode['type']>(
      data.nodes.map((node) => [node.id, node.type]),
    )

    for (const node of data.nodes) {
      if (scopedNodeIDs && !scopedNodeIDs.has(node.id)) continue
      if (sessionScopedNodeIDs && !sessionScopedNodeIDs.has(node.id)) continue

      const matchesType = activeTypes[node.type]
      const matchesQuery =
        !normalizedQuery ||
        node.label.toLowerCase().includes(normalizedQuery) ||
        ('summary' in node && node.summary?.toLowerCase().includes(normalizedQuery)) ||
        (node.type === 'article' && node.bodyText.toLowerCase().includes(normalizedQuery))

      if (matchesType && matchesQuery) visibleNodeIDs.add(node.id)
    }

    if (normalizedQuery) {
      for (const link of data.links) {
        if (visibleNodeIDs.has(link.source) || visibleNodeIDs.has(link.target)) {
          const sourceType = nodeTypes.get(link.source)
          const targetType = nodeTypes.get(link.target)
          if (
            sourceType &&
            activeTypes[sourceType] &&
            (!scopedNodeIDs || scopedNodeIDs.has(link.source)) &&
            (!sessionScopedNodeIDs || sessionScopedNodeIDs.has(link.source))
          ) {
            visibleNodeIDs.add(link.source)
          }
          if (
            targetType &&
            activeTypes[targetType] &&
            (!scopedNodeIDs || scopedNodeIDs.has(link.target)) &&
            (!sessionScopedNodeIDs || sessionScopedNodeIDs.has(link.target))
          ) {
            visibleNodeIDs.add(link.target)
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
      nodes: nodes.map((node, index) => ({
        ...node,
        ...initialNodePosition(node, index),
      })),
    }
  }, [activeTypes, data, focusedID, query, sourceSessionFilter])

  const selectedNode = data.nodes.find((node) => node.id === selectedID) || null
  const focusedNode = data.nodes.find((node) => node.id === focusedID) || null
  const activeID = selectedID || hoveredID
  const connectedIDs = useMemo(() => getConnectedIDs(data, activeID), [activeID, data])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph?.d3Force) return

    graph.d3Force('charge')?.strength?.(-260)
    graph.d3Force('link')?.distance?.((link: RuntimeLink) => linkDistance(link))
    graph.d3Force('center')?.strength?.(0.03)
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

  const focusNode = (nodeID: string | null) => {
    setFocusedID(nodeID)
    setSelectedID(nodeID)
    hasInitialViewRef.current = true
    window.setTimeout(() => fitGraph(650), 50)
  }

  const zoomOut = () => {
    if (!focusedID) return

    const parentID = getZoomOutID(data, focusedID)
    setFocusedID(parentID)
    setSelectedID(parentID)
    hasInitialViewRef.current = true
    window.setTimeout(() => fitGraph(650), 50)
  }

  const focusSearchResult = () => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return

    const match = data.nodes.find(
      (node) =>
        activeTypes[node.type] &&
        (node.label.toLowerCase().includes(normalizedQuery) ||
          ('summary' in node && node.summary?.toLowerCase().includes(normalizedQuery))),
    )

    if (!match) return

    setSelectedID(match.id)
    setFocusedID(match.id)
    const graph = graphRef.current
    const runtimeNode = filteredData.nodes.find((node) => node.id === match.id) as any
    if (graph?.centerAt && graph?.zoom && runtimeNode?.x != null && runtimeNode?.y != null) {
      graph.centerAt(runtimeNode.x, runtimeNode.y, 600)
      graph.zoom(1.35, 600)
    }
  }

  const importTopicMap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setImportStatus(null)
    setIsImporting(true)

    try {
      const response = await fetch('/api/wiki/topic-map/import', {
        body: JSON.stringify({
          eventID: importEventID,
          resourceURL: selectedImportResource?.url,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Import failed.')
      }

      setImportStatus({
        message: `Imported ${result.topicCandidates?.length || 0} topics and ${
          result.articleCandidates?.length || 0
        } article drafts.`,
        tone: 'success',
      })
      window.sessionStorage.setItem(
        'wikiTopicMapImportStatus',
        `Imported ${result.topicCandidates?.length || 0} topics and ${
          result.articleCandidates?.length || 0
        } article drafts from ${result.event?.title || 'session'}.`,
      )
      const params = new URLSearchParams(window.location.search)
      params.set('session', String(result.event?.id || importEventID))
      window.setTimeout(() => {
        window.location.href = `/wiki/explore?${params.toString()}`
      }, 900)
    } catch (error) {
      setImportStatus({
        message: error instanceof Error ? error.message : 'Import failed.',
        tone: 'error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const expandTopicWithPrism = async (node: TopicGraphNode) => {
    setExpansionStatus(null)
    setExpandingNodeID(node.id)

    try {
      const response = await fetch('/api/wiki/topics/expand', {
        body: JSON.stringify({
          topicID: topicIDFromNodeID(node.id),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Prism expansion failed.')
      }

      setExpansionStatus({
        message: result?.message || 'Prism expansion request was created.',
        nodeID: node.id,
        requestNumber: result?.prism?.request?.requestNumber,
        requestURL: result?.prism?.request?.artifactsURL,
        tone: 'success',
      })
    } catch (error) {
      setExpansionStatus({
        message: error instanceof Error ? error.message : 'Prism expansion failed.',
        nodeID: node.id,
        tone: 'error',
      })
    } finally {
      setExpandingNodeID(null)
    }
  }

  const importExpansionProposal = async (node: TopicGraphNode, requestNumber: number) => {
    setImportingExpansionNodeID(node.id)

    try {
      const response = await fetch('/api/wiki/topics/expansion/import', {
        body: JSON.stringify({
          focusTopicID: topicIDFromNodeID(node.id),
          requestNumber,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Proposal import failed.')
      }

      const topicCount = result?.topicCandidates?.length || 0
      const articleCount = result?.articleCandidates?.length || 0
      setExpansionStatus({
        message: `Imported ${topicCount} topics and ${articleCount} article drafts from Prism request #${requestNumber}.`,
        nodeID: node.id,
        requestNumber,
        tone: 'success',
      })
      window.setTimeout(() => {
        window.location.reload()
      }, 900)
    } catch (error) {
      setExpansionStatus({
        message: error instanceof Error ? error.message : 'Proposal import failed.',
        nodeID: node.id,
        requestNumber,
        tone: 'error',
      })
    } finally {
      setImportingExpansionNodeID(null)
    }
  }

  return (
    <section className="mt-10 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="min-w-0">
        <form
          className="mb-5 grid gap-3 border border-border bg-card/30 p-4 lg:grid-cols-[minmax(14rem,1.1fr)_minmax(14rem,1fr)_auto] lg:items-end"
          onSubmit={importTopicMap}
        >
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Session
            </span>
            <select
              className="h-11 w-full border border-border bg-background/80 px-3 text-sm text-foreground outline-none focus:border-primary"
              onChange={(event) => {
                setImportEventID(event.target.value)
                setImportResourceURL('')
              }}
              value={importEventID}
            >
              {topicMapSessions.length ? null : <option value="">No topic maps found</option>}
              {topicMapSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Artifact
            </span>
            <select
              className="h-11 w-full border border-border bg-background/80 px-3 text-sm text-foreground outline-none focus:border-primary"
              disabled={!selectedImportSession}
              onChange={(event) => setImportResourceURL(event.target.value)}
              value={selectedImportResource?.url || ''}
            >
              {selectedImportSession?.resources.map((resource) => (
                <option key={resource.url} value={resource.url}>
                  {resource.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="portal-admin-link inline-flex h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isImporting || !importEventID.trim() || !selectedImportResource}
            type="submit"
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            Import
          </button>
          {importStatus ? (
            <p
              className={
                importStatus.tone === 'error'
                  ? 'text-sm text-destructive lg:col-span-3'
                  : 'text-sm text-muted-foreground lg:col-span-3'
              }
            >
              {importStatus.message}
            </p>
          ) : null}
        </form>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full border border-border bg-background/80 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') focusSearchResult()
                }}
                placeholder="Find a category, topic, article, or source"
                value={query}
              />
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="portal-admin-link inline-flex items-center gap-2"
              onClick={focusSearchResult}
              type="button"
            >
              <Focus className="size-4" />
              Focus
            </button>
            <button
              className="portal-admin-link inline-flex items-center gap-2"
              onClick={() => {
                setQuery('')
                setFocusedID(null)
                setSelectedID(null)
                setSourceSessionFilter('')
                fitGraph(700)
              }}
              type="button"
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 border border-border bg-card/30 px-4 py-3">
          <label className="grid min-w-[16rem] flex-1 gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              From session
            </span>
            <select
              className="h-10 w-full border border-border bg-background/80 px-3 text-sm text-foreground outline-none focus:border-primary"
              onChange={(event) => {
                setSourceSessionFilter(event.target.value)
                setFocusedID(null)
                setSelectedID(null)
                window.setTimeout(() => fitGraph(650), 50)
              }}
              value={sourceSessionFilter}
            >
              <option value="">All sessions</option>
              {sessionOptions(data).map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
          {sourceSessionFilter ? (
            <button
              className="portal-admin-link inline-flex h-10 items-center gap-2"
              onClick={() => {
                setSourceSessionFilter('')
                window.setTimeout(() => fitGraph(650), 50)
              }}
              type="button"
            >
              <CalendarDays className="size-4" />
              Show all sessions
            </button>
          ) : null}
        </div>

        {focusedNode ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-card/30 px-4 py-3">
            <div className="min-w-0">
              <p className="portal-kicker">Focus</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{focusedNode.label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="portal-admin-link inline-flex items-center gap-2"
                disabled={!focusedID}
                onClick={zoomOut}
                type="button"
              >
                <StepBack className="size-4" />
                Zoom out
              </button>
              <button
                className="portal-admin-link inline-flex items-center gap-2"
                onClick={() => {
                  setFocusedID(null)
                  fitGraph(700)
                }}
                type="button"
              >
                <Maximize2 className="size-4" />
                Show all
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(['category', 'topic', 'possible', 'article', 'source'] as const).map((type) => (
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
            cooldownTicks={150}
            d3AlphaDecay={0.018}
            d3VelocityDecay={0.22}
            graphData={filteredData}
            height={dimensions.height}
            linkColor={(link: RuntimeLink) =>
              isConnectedLink(link, activeID) ? 'rgba(224,177,95,0.9)' : 'rgba(247,239,224,0.16)'
            }
            linkDirectionalParticles={(link: RuntimeLink) =>
              isConnectedLink(link, activeID) ? 2 : 0
            }
            linkDirectionalParticleSpeed={0.004}
            linkWidth={(link: RuntimeLink) => (isConnectedLink(link, activeID) ? 2 : 0.6)}
            nodeCanvasObject={(
              node: WikiExplorerNode,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) =>
              drawNode({ activeID, connectedIDs, ctx, globalScale, hoveredID, node, selectedID })
            }
            nodeLabel={(node: WikiExplorerNode) => node.label}
            nodePointerAreaPaint={(
              node: WikiExplorerNode,
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
            onNodeClick={(node: WikiExplorerNode) => setSelectedID(node.id)}
            onNodeHover={(node: WikiExplorerNode | null) => setHoveredID(node?.id || null)}
            onZoom={() => {
              hasInitialViewRef.current = true
            }}
            ref={graphRef}
            warmupTicks={90}
            width={dimensions.width}
          />
        </div>
      </div>

      <WikiNodeDrawer
        canManageWiki={canManageWiki}
        expandingNodeID={expandingNodeID}
        expansionStatus={expansionStatus}
        focusedID={focusedID}
        importingExpansionNodeID={importingExpansionNodeID}
        node={selectedNode}
        onClose={() => setSelectedID(null)}
        onExpandTopic={expandTopicWithPrism}
        onFocusNode={focusNode}
        onImportExpansionProposal={importExpansionProposal}
        onZoomOut={zoomOut}
      />
    </section>
  )
}

const typeLabels: Record<WikiExplorerNode['type'], string> = {
  article: 'Articles',
  category: 'Categories',
  possible: 'Possible',
  source: 'Sources',
  topic: 'Topics',
}

const WikiNodeDrawer: React.FC<{
  canManageWiki: boolean
  expandingNodeID: string | null
  expansionStatus: {
    message: string
    nodeID: string
    requestNumber?: number | null
    requestURL?: string | null
    tone: 'error' | 'success'
  } | null
  focusedID: string | null
  importingExpansionNodeID: string | null
  node: WikiExplorerNode | null
  onClose: () => void
  onExpandTopic: (node: TopicGraphNode) => void
  onFocusNode: (nodeID: string | null) => void
  onImportExpansionProposal: (node: TopicGraphNode, requestNumber: number) => void
  onZoomOut: () => void
}> = ({
  canManageWiki,
  expandingNodeID,
  expansionStatus,
  focusedID,
  importingExpansionNodeID,
  node,
  onClose,
  onExpandTopic,
  onFocusNode,
  onImportExpansionProposal,
  onZoomOut,
}) => {
  if (!node) {
    return (
      <aside className="portal-panel 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto">
        <p className="portal-kicker">Selection</p>
        <h2 className="mt-2 portal-heading-sm">Choose a node</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Click a category, topic, article, or source to inspect it without leaving the graph.
        </p>
      </aside>
    )
  }

  return (
    <aside className="portal-panel 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <p className="portal-kicker">{drawerKicker(node)}</p>
        <button
          aria-label="Close selection"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
      <h2 className="mt-3 portal-heading-sm">{node.label}</h2>

      {'summary' in node && node.summary ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{node.summary}</p>
      ) : null}

      {node.type === 'article' ? (
        <ArticleDetails canManageWiki={canManageWiki} node={node} />
      ) : null}
      {node.type === 'category' || node.type === 'topic' || node.type === 'possible' ? (
        <TopicDetails
          canManageWiki={canManageWiki}
          isExpanding={expandingNodeID === node.id}
          isImportingExpansion={importingExpansionNodeID === node.id}
          node={node}
          onExpandTopic={onExpandTopic}
          onImportExpansionProposal={onImportExpansionProposal}
          status={expansionStatus?.nodeID === node.id ? expansionStatus : null}
        />
      ) : null}
      {node.type === 'source' ? <SourceDetails node={node} /> : null}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
        <button
          className="portal-admin-link inline-flex items-center gap-2"
          onClick={() => onFocusNode(node.id)}
          type="button"
        >
          <Focus className="size-4" />
          Focus node
        </button>
        {focusedID ? (
          <button
            className="portal-admin-link inline-flex items-center gap-2"
            onClick={onZoomOut}
            type="button"
          >
            <StepBack className="size-4" />
            Zoom out
          </button>
        ) : null}
      </div>
    </aside>
  )
}

const TopicDetails = ({
  canManageWiki,
  isExpanding,
  isImportingExpansion,
  node,
  onExpandTopic,
  onImportExpansionProposal,
  status,
}: {
  canManageWiki: boolean
  isExpanding: boolean
  isImportingExpansion: boolean
  node: TopicGraphNode
  onExpandTopic: (node: TopicGraphNode) => void
  onImportExpansionProposal: (node: TopicGraphNode, requestNumber: number) => void
  status: {
    message: string
    requestNumber?: number | null
    requestURL?: string | null
    tone: 'error' | 'success'
  } | null
}) => (
  <div className="mt-5 space-y-5">
    <Pills
      items={[
        node.kind,
        node.reviewStatus,
        node.visibility,
        `confidence: ${node.confidence}`,
        `${node.articleCount} article${node.articleCount === 1 ? '' : 's'}`,
        `${node.sourceCount} source${node.sourceCount === 1 ? '' : 's'}`,
      ]}
    />
    <MetaRow label="Last reviewed" value={formatDate(node.lastReviewedAt)} />
    <MetaRow label="Last expanded" value={formatDateTime(node.lastExpandedAt)} />
    {node.reviewStatus === 'suggested' || node.type === 'possible' ? (
      <p className="text-sm leading-6 text-muted-foreground">
        Suggested topics are intentionally lightweight. They can be explored immediately and cleaned
        up later without making them canonical.
      </p>
    ) : null}
    <div className="space-y-3">
      <button
        className="portal-admin-link inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isExpanding}
        onClick={() => onExpandTopic(node)}
        type="button"
      >
        {isExpanding ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Expand with Prism
      </button>
      {node.type !== 'category' && node.articleCount === 0 ? (
        <WikiArticleGenerateControl topicID={topicIDFromNodeID(node.id)} />
      ) : null}
      {status ? (
        <div className="space-y-3">
          <p
            className={
              status.tone === 'error'
                ? 'text-sm text-destructive'
                : 'text-sm leading-6 text-muted-foreground'
            }
          >
            {status.message}
          </p>
          {status.tone === 'success' && status.requestNumber ? (
            <button
              className="portal-admin-link inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isImportingExpansion}
              onClick={() => onImportExpansionProposal(node, status.requestNumber!)}
              type="button"
            >
              {isImportingExpansion ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              Import proposal
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
    {canManageWiki ? (
      <Link
        className="portal-admin-link inline-flex items-center gap-2"
        href="/admin/collections/wikiTopics"
      >
        <GitBranch className="size-4" />
        Manage topic
      </Link>
    ) : null}
  </div>
)

const ArticleDetails = ({
  canManageWiki,
  node,
}: {
  canManageWiki: boolean
  node: ArticleGraphNode
}) => (
  <div className="mt-5 space-y-5">
    <Pills
      items={[
        node.status || 'draft',
        node.reviewStatus,
        node.visibility,
        `confidence: ${node.confidence}`,
        `${node.sourceCount} source${node.sourceCount === 1 ? '' : 's'}`,
      ]}
    />
    <div className="grid gap-2 text-sm text-muted-foreground">
      <MetaRow label="Last reviewed" value={formatDate(node.lastReviewedAt)} />
      <MetaRow label="Last refreshed" value={formatDate(node.lastRefreshedAt)} />
    </div>
    {node.bodySections.length ? (
      <div>
        <p className="portal-kicker">Article text</p>
        <div className="mt-3 space-y-3">
          {node.bodySections.map((section) => (
            <p className="text-sm leading-6 text-muted-foreground" key={section}>
              {section}
            </p>
          ))}
        </div>
      </div>
    ) : null}
    <DiscoveryLinkGroups links={node.discoveryLinks} />
    <div className="flex flex-wrap gap-3">
      {node.href ? (
        <Link className="portal-admin-link inline-flex items-center gap-2" href={node.href}>
          <ExternalLink className="size-4" />
          Open page
        </Link>
      ) : null}
      {canManageWiki ? (
        <Link className="portal-admin-link" href="/admin/collections/wikiPages">
          Review articles
        </Link>
      ) : null}
    </div>
  </div>
)

const DiscoveryLinkGroups = ({ links }: { links: ArticleDiscoveryLinks }) => {
  const groups = [
    ['Further reading', links.furtherReading],
    ['Papers', links.papers],
    ['Tools', links.tools],
  ] as const

  const visibleGroups = groups.filter(([, items]) => items.length > 0)

  if (!visibleGroups.length) return null

  return (
    <div className="space-y-4">
      {visibleGroups.map(([label, items]) => (
        <div key={label}>
          <p className="portal-kicker">{label}</p>
          <div className="mt-3 grid gap-3">
            {items.map((item) => (
              <div
                className="border border-border bg-background/50 p-3"
                key={`${label}:${item.label}`}
              >
                {item.url ? (
                  <a
                    className="inline-flex items-start gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="mt-0.5 size-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                )}
                {item.note ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const SourceDetails = ({ node }: { node: SourceGraphNode }) => (
  <div className="mt-5 space-y-5">
    <Pills items={[node.sourceType, formatDate(node.observedAt) || 'undated']} />
    {node.artifactID ? <MetaRow label="Artifact" value={node.artifactID} /> : null}
    {node.sourceURL ? (
      <a
        className="portal-admin-link inline-flex items-center gap-2"
        href={node.sourceURL}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink className="size-4" />
        Open source
      </a>
    ) : null}
  </div>
)

const Pills = ({ items }: { items: (string | null | undefined)[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.filter(Boolean).map((item) => (
      <span className="portal-pill" key={item}>
        {item}
      </span>
    ))}
  </div>
)

const MetaRow = ({ label, value }: { label: string; value?: string | null }) => (
  <p className="text-sm text-muted-foreground">
    <span className="text-foreground">{label}:</span> {value || 'Not recorded'}
  </p>
)

const drawerKicker = (node: WikiExplorerNode) => {
  if (node.type === 'article') return 'Article'
  if (node.type === 'source') return node.sourceType
  if (node.type === 'category') return 'Category'
  if (node.type === 'possible') return 'Possible topic'
  return 'Topic'
}

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
  node: WikiExplorerNode
  selectedID: string | null
}) => {
  const x = (node as any).x || 0
  const y = (node as any).y || 0
  const radius = nodeRadius(node)
  const isActive = node.id === selectedID || node.id === hoveredID
  const isConnected = !activeID || node.id === activeID || connectedIDs.has(node.id)
  const alpha = isConnected ? 1 : 0.28

  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = nodeColors[node.type]
  ctx.fill()

  ctx.lineWidth = isActive ? 3 : node.type === 'possible' ? 1.5 : 1
  ctx.strokeStyle = isActive
    ? '#FFFFFF'
    : node.type === 'possible'
      ? '#D7E3B0'
      : 'rgba(255,255,255,0.45)'
  ctx.setLineDash(node.type === 'possible' ? [4, 3] : [])
  ctx.stroke()
  ctx.setLineDash([])

  const label = node.label
  const fontSize = Math.max(10, Math.min(15, 13 / globalScale))
  const labelWidth = ctx.measureText(label).width
  const shouldShowLabel = globalScale > 0.65 || isActive || node.type === 'category'

  if (shouldShowLabel) {
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(247,239,224,0.94)'
    ctx.fillText(label, x - labelWidth / 2, y + radius + 6)
  }

  ctx.globalAlpha = 1
}

const nodeRadius = (node: WikiExplorerNode) => {
  if (node.type === 'category') return 13
  if (node.type === 'article') return 9
  if (node.type === 'source') return 6
  if (node.type === 'possible') return 8
  return 10
}

const linkDistance = (link: RuntimeLink) => {
  if (link.type === 'contains') return 120
  if (link.type === 'has_article') return 90
  if (link.type === 'has_source') return 72
  return 130
}

const initialNodePosition = (node: WikiExplorerNode, index: number) => {
  const ring = node.type === 'category' ? 120 : node.type === 'article' ? 280 : 210
  const angle = index * 1.618

  return {
    x: Math.cos(angle) * ring,
    y: Math.sin(angle) * ring,
  }
}

const getConnectedIDs = (data: WikiExplorerGraphData, activeID: string | null) => {
  const connected = new Set<string>()
  if (!activeID) return connected

  for (const link of data.links) {
    if (link.source === activeID) connected.add(link.target)
    if (link.target === activeID) connected.add(link.source)
  }

  return connected
}

const getScopedNodeIDs = (data: WikiExplorerGraphData, focusedID: string | null) => {
  if (!focusedID) return null

  const focusedNode = data.nodes.find((node) => node.id === focusedID)
  if (!focusedNode) return null

  const scoped = new Set<string>([focusedID])
  const parentID = getParentTopicID(data, focusedID)

  if (parentID) scoped.add(parentID)

  if (focusedNode.type === 'category') {
    for (const childID of getChildTopicIDs(data, focusedID)) {
      scoped.add(childID)
      addLinkedArticlesAndSources(data, childID, scoped)
    }

    addLinkedArticlesAndSources(data, focusedID, scoped)
    return scoped
  }

  if (focusedNode.type === 'topic' || focusedNode.type === 'possible') {
    if (parentID) {
      for (const siblingID of getChildTopicIDs(data, parentID)) scoped.add(siblingID)
    }

    for (const childID of getChildTopicIDs(data, focusedID)) scoped.add(childID)
    for (const relatedID of getRelatedTopicIDs(data, focusedID)) scoped.add(relatedID)
    addLinkedArticlesAndSources(data, focusedID, scoped)

    return scoped
  }

  if (focusedNode.type === 'article') {
    for (const topicID of getIncomingNodeIDs(data, focusedID)) {
      scoped.add(topicID)
      const parent = getParentTopicID(data, topicID)
      if (parent) scoped.add(parent)
    }
    addOutgoingSources(data, focusedID, scoped)

    return scoped
  }

  for (const sourceParentID of getIncomingNodeIDs(data, focusedID)) {
    scoped.add(sourceParentID)
    for (const topicID of getIncomingNodeIDs(data, sourceParentID)) scoped.add(topicID)
  }

  return scoped
}

const getSessionScopedNodeIDs = (data: WikiExplorerGraphData, sessionID: string) => {
  if (!sessionID) return null

  const scoped = new Set<string>()

  for (const node of data.nodes) {
    if (nodeHasSession(node, sessionID)) {
      scoped.add(node.id)
      addLinkedArticlesAndSources(data, node.id, scoped)
      for (const incomingID of getIncomingNodeIDs(data, node.id)) scoped.add(incomingID)
      for (const outgoingID of getOutgoingNodeIDs(data, node.id)) scoped.add(outgoingID)
    }
  }

  for (const nodeID of Array.from(scoped)) {
    if (nodeID.startsWith('article:')) {
      for (const topicID of getIncomingNodeIDs(data, nodeID)) scoped.add(topicID)
      addOutgoingSources(data, nodeID, scoped)
    }
  }

  return scoped
}

const nodeHasSession = (node: WikiExplorerNode, sessionID: string) => {
  if (node.type === 'source') return false

  return node.sourceSessions.some((session) => String(session.id) === sessionID)
}

const sessionOptions = (data: WikiExplorerGraphData): SessionRef[] => {
  const sessions = new Map<number, SessionRef>()

  for (const node of data.nodes) {
    if (node.type === 'source') continue
    for (const session of node.sourceSessions) sessions.set(session.id, session)
  }

  return Array.from(sessions.values()).sort((a, b) => a.title.localeCompare(b.title))
}

const initialSessionID = () => {
  if (typeof window === 'undefined') return ''

  return new URLSearchParams(window.location.search).get('session') || ''
}

const initialTopicNodeID = () => {
  if (typeof window === 'undefined') return null

  const topicID = new URLSearchParams(window.location.search).get('topic')
  if (!topicID || !/^\d+$/.test(topicID)) return null

  return `topic:${topicID}`
}

const topicIDFromNodeID = (nodeID: `topic:${number}`) => Number(nodeID.replace('topic:', ''))

const getZoomOutID = (data: WikiExplorerGraphData, focusedID: string) => {
  const focusedNode = data.nodes.find((node) => node.id === focusedID)
  if (!focusedNode) return null

  if (focusedNode.type === 'category') return null

  if (focusedNode.type === 'topic' || focusedNode.type === 'possible') {
    return getParentTopicID(data, focusedID)
  }

  const incoming = getIncomingNodeIDs(data, focusedID)
  return incoming[0] || null
}

const getParentTopicID = (data: WikiExplorerGraphData, nodeID: string) =>
  data.links.find((link) => link.type === 'contains' && link.target === nodeID)?.source || null

const getChildTopicIDs = (data: WikiExplorerGraphData, nodeID: string) =>
  data.links
    .filter((link) => link.type === 'contains' && link.source === nodeID)
    .map((link) => link.target)

const getRelatedTopicIDs = (data: WikiExplorerGraphData, nodeID: string) =>
  data.links
    .filter(
      (link) => link.type === 'relates_to' && (link.source === nodeID || link.target === nodeID),
    )
    .map((link) => (link.source === nodeID ? link.target : link.source))

const getIncomingNodeIDs = (data: WikiExplorerGraphData, nodeID: string) =>
  data.links.filter((link) => link.target === nodeID).map((link) => link.source)

const addLinkedArticlesAndSources = (
  data: WikiExplorerGraphData,
  nodeID: string,
  scoped: Set<string>,
) => {
  for (const link of data.links) {
    if (link.source !== nodeID) continue

    if (link.type === 'has_article' || link.type === 'has_source') {
      scoped.add(link.target)
      addOutgoingSources(data, link.target, scoped)
    }
  }
}

const addOutgoingSources = (data: WikiExplorerGraphData, nodeID: string, scoped: Set<string>) => {
  for (const link of data.links) {
    if (link.source === nodeID && link.type === 'has_source') scoped.add(link.target)
  }
}

const getOutgoingNodeIDs = (data: WikiExplorerGraphData, nodeID: string) =>
  data.links.filter((link) => link.source === nodeID).map((link) => link.target)

const isConnectedLink = (link: RuntimeLink, activeID: string | null) => {
  if (!activeID) return false

  const sourceID = typeof link.source === 'string' ? link.source : link.source.id
  const targetID = typeof link.target === 'string' ? link.target : link.target.id

  return sourceID === activeID || targetID === activeID
}

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}
