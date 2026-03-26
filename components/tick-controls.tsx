"use client"

import { useState } from "react"
import { advanceTick, autoTick } from "@/lib/api"

interface TickControlsProps {
  currentTick: number
  onTickUpdate?: (newTick: number) => void
}

export default function TickControls({ currentTick, onTickUpdate }: TickControlsProps) {
  const [tickCount, setTickCount] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleManualTick() {
    setLoading(true)
    try {
      const result = await advanceTick(tickCount)
      onTickUpdate?.(result.current_tick)
    } catch {
      // Server offline — just simulate
      onTickUpdate?.(currentTick + tickCount)
    }
    setLoading(false)
  }

  async function handleAutoTick() {
    setLoading(true)
    try {
      const result = await autoTick()
      onTickUpdate?.(result.current_tick)
    } catch {
      onTickUpdate?.(currentTick + 1)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted">틱 제어</span>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-primary/60 p-1">
        <input
          type="number"
          min={1}
          max={100}
          value={tickCount}
          onChange={(e) => setTickCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 rounded bg-transparent px-2 py-1 text-center text-sm text-text-primary focus:outline-none"
        />
        <button
          onClick={handleManualTick}
          disabled={loading}
          className="btn-primary !py-1 !px-3 text-xs disabled:opacity-50"
        >
          {loading ? "..." : "수동 틱"}
        </button>
      </div>
      <button
        onClick={handleAutoTick}
        disabled={loading}
        className="btn-ghost !py-1 !px-3 text-xs border border-border disabled:opacity-50"
      >
        자동 틱
      </button>
    </div>
  )
}
