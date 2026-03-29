"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import * as d3 from "d3"
import Link from "next/link"
import { MousePointerClick } from "lucide-react"
import { Memory, MTYPE_LABELS } from "@/lib/types"
import { useChartColors, getScoreColor } from "@/lib/theme-colors"
import { useTranslations } from "next-intl"

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  text: string
  category: string
  importance: number
  retrieval_score: number
  mtype: string
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
  weight: number
}

interface AssociationGraphProps {
  memories: Memory[]
}

export default function AssociationGraph({ memories }: AssociationGraphProps) {
  const t = useTranslations('graph')
  const tSearch = useTranslations('search')
  const colors = useChartColors()
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [highlight, setHighlight] = useState("")
  const [threshold, setThreshold] = useState(0.0)
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => new Set(memories.map(m => m.category)))

  // Filter out empty/null/undefined categories
  const allCategories = Array.from(new Set(memories.map(m => m.category).filter(Boolean)))
  const filteredMemories = memories.filter(m => m.category && activeCategories.has(m.category) && m.retrieval_score >= threshold)

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Build graph data (nodes + links) from filtered memories
  const graphData = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>()
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    for (const m of filteredMemories) {
      const node: GraphNode = {
        id: m.id, text: m.text, category: m.category,
        importance: m.importance, retrieval_score: m.retrieval_score, mtype: m.mtype,
      }
      nodeMap.set(m.id, node)
      nodes.push(node)
    }

    for (const m of filteredMemories) {
      for (const assocId of m.associations) {
        if (nodeMap.has(assocId) && m.id < assocId) {
          links.push({ source: m.id, target: assocId, weight: 0.5 })
        }
      }
    }
    return { nodes, links }
  }, [filteredMemories])

  // Stable key for detecting when the node set actually changes
  const nodeSetKey = filteredMemories.map(m => m.id).sort().join(",")

  // Zoom behavior ref
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity)

  // Reset zoom/pan view
  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity)
    transformRef.current = d3.zoomIdentity
  }, [])

  // Main simulation effect — only rebuilds when node set changes
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return

    // Stop previous simulation if any
    simulationRef.current?.stop()

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = 500

    svg.selectAll("*").remove()

    const { nodes, links } = graphData

    // Create container group for zoom
    const container = svg.append("g")

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString())
        transformRef.current = event.transform
      })
    
    zoomRef.current = zoom
    svg.call(zoom as any)

    // Calculate initial zoom to fit all nodes
    const initialScale = Math.min(1, Math.min(width / 800, height / 600))
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initialScale)
      .translate(-width / 2, -height / 2)
    
    svg.call(zoom.transform as any, initialTransform)
    transformRef.current = initialTransform

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d: GraphNode) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d: GraphNode) => 8 + d.importance * 12))

    simulationRef.current = simulation

    const linkSel = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", colors.border)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)

    const nodeSel = container.append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on("drag", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d) => {
          d.fx = event.x; d.fy = event.y
        })
        .on("end", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    nodeSel.append("circle")
      .attr("r", (d: GraphNode) => 6 + d.importance * 10)
      .attr("fill", (d: GraphNode) => getScoreColor(d.retrieval_score, colors))
      .attr("fill-opacity", 0.85)
      .attr("stroke", "none")
      .attr("stroke-width", 2)

    nodeSel.filter((d: GraphNode) => d.importance >= 0.6)
      .append("text")
      .text((d: GraphNode) => d.text.slice(0, 12) + (d.text.length > 12 ? "..." : ""))
      .attr("dx", (d: GraphNode) => 8 + d.importance * 10)
      .attr("dy", 4)
      .attr("fill", colors.textMuted)
      .attr("font-size", 9)
      .attr("pointer-events", "none")

    nodeSel.on("click", (_event: MouseEvent, d: GraphNode) => {
      setSelected(prev => prev?.id === d.id ? null : d)
    })

    nodeSel.on("mouseenter", (_event: MouseEvent, d: GraphNode) => {
      nodeSel.attr("opacity", (n: GraphNode) => {
        if (n.id === d.id) return 1
        return links.some(l =>
          ((l.source as GraphNode).id === d.id && (l.target as GraphNode).id === n.id) ||
          ((l.target as GraphNode).id === d.id && (l.source as GraphNode).id === n.id)
        ) ? 1 : 0.3
      })
      linkSel.attr("stroke-opacity", (l: GraphLink) => {
        const sId = (l.source as GraphNode).id
        const tId = (l.target as GraphNode).id
        return sId === d.id || tId === d.id ? 1 : 0.1
      })
    }).on("mouseleave", () => {
      nodeSel.attr("opacity", 1)
      linkSel.attr("stroke-opacity", 0.6)
    })

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d: GraphLink) => (d.source as GraphNode).x || 0)
        .attr("y1", (d: GraphLink) => (d.source as GraphNode).y || 0)
        .attr("x2", (d: GraphLink) => (d.target as GraphNode).x || 0)
        .attr("y2", (d: GraphLink) => (d.target as GraphNode).y || 0)
      nodeSel.attr("transform", (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`)
    })

    return () => { simulation.stop() }
  }, [nodeSetKey, graphData, colors])

  // Lightweight: update visual highlights without rebuilding simulation
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const circles = svg.selectAll<SVGCircleElement, GraphNode>("circle")

    if (!circles.size()) return

    // Search highlight
    if (highlight) {
      const q = highlight.toLowerCase()
      circles
        .attr("stroke", (d: GraphNode) =>
          d.text.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) ? colors.accent : "none"
        )
        .attr("stroke-width", (d: GraphNode) =>
          d.text.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) ? 3 : 0
        )
    } else {
      circles.attr("stroke", "none").attr("stroke-width", 2)
    }

    // Selection highlight
    if (selected) {
      circles.attr("stroke", (d: GraphNode) =>
        d.id === selected.id ? colors.textPrimary : circles.attr("stroke") === "none" ? "none" : circles.attr("stroke")
      )
      circles.filter((d: GraphNode) => d.id === selected.id).attr("stroke", colors.textPrimary).attr("stroke-width", 2)
    }
  }, [highlight, selected?.id, colors])

  const edgeCount = filteredMemories.reduce(
    (sum, m) => sum + m.associations.filter(a => filteredMemories.some(f => f.id === a)).length, 0
  ) / 2

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder={tSearch('placeholder')}
            value={highlight}
            onChange={e => setHighlight(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>활성도 ≥</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="font-mono w-8">{threshold.toFixed(2)}</span>
        </div>
        <button onClick={resetView} className="btn-secondary text-xs py-1 px-3">
          {t('resetView')}
        </button>
      </div>
      
      {/* Zoom/Pan hint */}
      <div className="text-[10px] text-text-muted">
        {t('zoomHint')}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-muted font-medium">{t('categoryFilter')}:</span>
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-xs font-medium px-3 py-1.5 border rounded-md transition-all duration-200 ${
              activeCategories.has(cat)
                ? "bg-accent text-text-inverse border-accent shadow-sm"
                : "bg-surface-1 text-text-muted border-border/60 hover:border-accent/50 hover:bg-surface-2"
            }`}
          >
            {cat}
          </button>
        ))}
        {allCategories.length > 1 && (
          <button
            onClick={() => setActiveCategories(new Set(allCategories))}
            className="text-xs text-accent hover:text-accent-secondary hover:underline ml-2 transition-colors duration-200"
          >
            {t('selectAll')}
          </button>
        )}
      </div>

      {/* Graph + Detail Panel */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="chart-section overflow-hidden">
          {filteredMemories.length === 0 ? (
            <div className="flex items-center justify-center h-[500px] text-text-muted text-sm">
              표시할 메모리가 없습니다. 필터를 조정하세요.
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height={500} />
          )}
        </div>

        {selected ? (
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="label">노드 상세</span>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary text-sm">×</button>
            </div>
            <div className="font-mono text-[10px] text-text-muted">{selected.id}</div>
            <p className="text-sm text-text-primary leading-relaxed">{selected.text}</p>
            <div className="space-y-1 text-xs text-text-secondary">
              <div>카테고리: <span className="text-accent">{selected.category}</span></div>
              <div>유형: {MTYPE_LABELS[selected.mtype] || selected.mtype}</div>
              <div>중요도: <span className="font-mono">{selected.importance.toFixed(2)}</span></div>
              <div>검색 점수: <span className="font-mono">{selected.retrieval_score.toFixed(3)}</span></div>
            </div>
            <Link href={`/memory/${selected.id}`} className="btn-primary block text-center text-xs mt-3">
              상세 보기
            </Link>
          </div>
        ) : (
          <div className="panel p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <MousePointerClick size={16} className="text-accent" />
              <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">{t('instructions.title')}</span>
            </div>
            
            {/* Instructions */}
            <div className="text-xs text-text-muted space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-surface-2 text-[10px] font-bold">1</span>
                <span>{t('instructions.step1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-surface-2 text-[10px] font-bold">2</span>
                <span>{t('instructions.step2')}</span>
              </div>
            </div>

            {/* Legend - Node Colors */}
            <div className="border-t-2 border-border pt-3">
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">{t('instructions.nodeColor')}</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-accent-secondary border border-border" />
                  <span className="text-xs text-text-secondary">{t('instructions.high')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-accent-warm border border-border" />
                  <span className="text-xs text-text-secondary">{t('instructions.medium')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-status-danger border border-border" />
                  <span className="text-xs text-text-secondary">{t('instructions.low')}</span>
                </div>
              </div>
            </div>

            {/* Legend - Node Size */}
            <div className="border-t-2 border-border pt-3">
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">{t('instructions.nodeSize')}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-text-muted" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-text-muted" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded-full bg-text-muted" />
                </div>
              </div>
              <div className="text-[10px] text-text-muted mt-1">{t('instructions.sizeDesc')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="stat-card">
          <div className="label mb-1">표시 노드</div>
          <div className="font-mono text-lg font-bold text-accent">{filteredMemories.length}</div>
        </div>
        <div className="stat-card">
          <div className="label mb-1">연관 엣지</div>
          <div className="font-mono text-lg font-bold text-accent-secondary">{edgeCount}</div>
        </div>
        <div className="stat-card">
          <div className="label mb-1">카테고리</div>
          <div className="font-mono text-lg font-bold text-text-primary">{allCategories.length}</div>
        </div>
      </div>
    </div>
  )
}
