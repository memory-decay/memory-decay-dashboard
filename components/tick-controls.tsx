"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { advanceTick, autoTick } from "@/lib/api"

interface TickControlsProps {
  currentTick: number
  onTickUpdate?: (newTick: number) => void
}

export default function TickControls({ currentTick, onTickUpdate }: TickControlsProps) {
  const t = useTranslations('tickControls')
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
      <span className="text-xs text-text-muted font-medium">{t('label')}</span>
      <div className="flex items-center gap-1 border-2 border-border bg-bg-surface rounded-lg p-1 shadow-sm">
        <input
          type="number"
          min={1}
          max={100}
          value={tickCount}
          onChange={(e) => setTickCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 bg-transparent px-2 py-1 text-center text-sm text-text-primary focus:outline-none border-0 rounded"
        />
        <button
          onClick={handleManualTick}
          disabled={loading}
          className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
        >
          {loading ? "..." : t('manual')}
        </button>
      </div>
      <button
        onClick={handleAutoTick}
        disabled={loading}
        className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-50"
      >
        {t('auto')}
      </button>
    </div>
  )
}
