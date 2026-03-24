"use client"

import { useMemo } from "react"
import type { DerivedMemoryState } from "@/lib/types"

type ConstellationProps = {
  memories: Record<string, DerivedMemoryState>
  selectedId: string | null
  onSelect: (id: string) => void
  currentTick: number
  memoryCount: number
  associationCount: number
  spotlightLabel?: string
  spotlightId?: string
}

type Edge = { from: string; to: string; weight: number }

function extractEdges(memories: Record<string, DerivedMemoryState>): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []
  for (const mem of Object.values(memories)) {
    for (const assoc of mem.associations) {
      const key = [mem.id, assoc.targetId].sort().join("||")
      if (!seen.has(key) && memories[assoc.targetId]) {
        seen.add(key)
        edges.push({ from: mem.id, to: assoc.targetId, weight: assoc.weight })
      }
    }
  }
  return edges
}

function nodeColor(score: number): string {
  if (score > 0.6) return "52,211,153"
  if (score > 0.3) return "245,166,91"
  if (score > 0.1) return "248,113,113"
  return "112,128,156"
}

function glowFilter(score: number): string {
  if (score > 0.6) return "url(#glow-strong)"
  if (score > 0.3) return "url(#glow-mid)"
  if (score > 0.1) return "url(#glow-dim)"
  return ""
}

function spiralLayout(
  memories: DerivedMemoryState[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(width, height) * 0.42
  const sorted = [...memories].sort((a, b) => b.storage_score - a.storage_score)
  const positions = new Map<string, { x: number; y: number }>()

  if (sorted.length === 0) return positions

  positions.set(sorted[0].id, { x: cx, y: cy })

  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 1; i < sorted.length; i++) {
    const frac = i / sorted.length
    const r = maxR * Math.sqrt(frac)
    const theta = i * goldenAngle
    positions.set(sorted[i].id, {
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    })
  }

  return positions
}

const SVG_W = 800
const SVG_H = 220

export function Constellation({
  memories,
  selectedId,
  onSelect,
  currentTick,
  memoryCount,
  associationCount,
  spotlightLabel,
  spotlightId,
}: ConstellationProps) {
  const memoryList = useMemo(() => Object.values(memories), [memories])
  const edges = useMemo(() => extractEdges(memories), [memories])
  const positions = useMemo(
    () => spiralLayout(memoryList, SVG_W, SVG_H),
    [memoryList],
  )

  return (
    <section className="constellation-section panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Memory constellation</p>
          {spotlightLabel ? (
            <button
              type="button"
              className="mt-1 text-left text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
              onClick={() => spotlightId && onSelect(spotlightId)}
            >
              Spotlight: {spotlightLabel}
            </button>
          ) : null}
        </div>
        <div className="flex gap-4">
          {[
            { color: "#34d399", label: "Strong" },
            { color: "#f5a65b", label: "Weakening" },
            { color: "#f87171", label: "Fading" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-5">
        <div className="flex-1 min-h-[220px]">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full">
            <defs>
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-mid" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-dim" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Association edges */}
            {edges.map((edge) => {
              const from = positions.get(edge.from)
              const to = positions.get(edge.to)
              if (!from || !to) return null
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={`rgba(124,156,255,${(edge.weight * 0.2).toFixed(2)})`}
                  strokeWidth={edge.weight > 0.5 ? 1 : 0.5}
                />
              )
            })}

            {/* Memory nodes */}
            {memoryList.map((mem) => {
              const pos = positions.get(mem.id)
              if (!pos) return null
              const r = 8 + mem.importance * 18
              const rgb = nodeColor(mem.storage_score)
              const opacity = Math.max(mem.storage_score, 0.05)
              const isSelected = selectedId === mem.id
              const filter = glowFilter(mem.storage_score)
              const pulseClass = mem.storage_score > 0.8 ? "constellation-glow-pulse" : ""

              return (
                <g
                  key={mem.id}
                  role="img"
                  aria-label={`Memory ${mem.id}: storage ${mem.storage_score.toFixed(2)}, retrieval ${mem.retrieval_score.toFixed(2)}`}
                  className={`cursor-pointer ${pulseClass}`}
                  onClick={() => onSelect(mem.id)}
                >
                  <circle
                    cx={pos.x} cy={pos.y} r={r}
                    fill={`rgba(${rgb},${(opacity * 0.15).toFixed(2)})`}
                    stroke={`rgba(${rgb},${(opacity * 0.6).toFixed(2)})`}
                    strokeWidth={isSelected ? 2 : 1}
                    filter={filter}
                  />
                  {isSelected && (
                    <circle
                      cx={pos.x} cy={pos.y} r={r + 4}
                      fill="none"
                      stroke="rgba(124,156,255,0.4)"
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                    />
                  )}
                  {r >= 12 && (
                    <text
                      x={pos.x} y={pos.y + 3}
                      fill={`rgba(${rgb},${Math.max(opacity, 0.3).toFixed(2)})`}
                      fontSize={r >= 18 ? 9 : 7}
                      textAnchor="middle"
                      fontFamily="DM Mono, monospace"
                      fontWeight={500}
                    >
                      {mem.storage_score.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Sidebar stats */}
        <div className="flex w-[180px] flex-shrink-0 flex-col gap-3">
          <div className="stat-card">
            <p className="label">Current Tick</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent font-mono">{currentTick}</p>
          </div>
          <div className="stat-card">
            <p className="label">Memories</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent-secondary font-mono">{memoryCount}</p>
          </div>
          <div className="stat-card">
            <p className="label">Associations</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent-warm font-mono">{associationCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
