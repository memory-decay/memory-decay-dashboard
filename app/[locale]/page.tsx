"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { getStats, getAllMemories } from "@/lib/api"
import { SystemStats, Memory } from "@/lib/types"
import { MOCK_STATS, MOCK_MEMORIES } from "@/lib/mock-data"
import StatsCards from "@/components/stats-cards"
import TickControls from "@/components/tick-controls"
import QuickSearch from "@/components/quick-search"
import MemoryTable from "@/components/memory-table"

export default function DashboardPage() {
  const t = useTranslations('page.dashboard')
  const [stats, setStats] = useState<SystemStats>(MOCK_STATS)
  const [memories, setMemories] = useState<Memory[]>(MOCK_MEMORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, m] = await Promise.all([getStats(), getAllMemories()])
      setStats(s)
      setMemories(m)
      setLoading(false)
    }
    load()
  }, [])

  function handleTickUpdate(newTick: number) {
    setStats(prev => ({ ...prev, current_tick: newTick }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-sm text-text-muted">{t('subtitle')}</p>
        </div>
        <TickControls currentTick={stats.current_tick} onTickUpdate={handleTickUpdate} />
      </div>

      {/* Stats */}
      <StatsCards stats={stats} memories={memories} />

      {/* Search */}
      <div className="max-w-lg">
        <QuickSearch />
      </div>

      {/* Memory Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{t('recentMemories')}</h2>
          {loading && <span className="text-xs text-text-muted">{t('loading')}</span>}
        </div>
        <MemoryTable memories={memories} />
      </div>
    </div>
  )
}
