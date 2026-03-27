"use client"

import { SystemStats } from "@/lib/types"
import { Memory } from "@/lib/types"
import { useTranslations } from "next-intl"

interface StatsCardsProps {
  stats: SystemStats
  memories: Memory[]
}

const STAT_KEYS = [
  { key: "totalMemories", statKey: "num_memories", accent: "text-accent" as const },
  { key: "currentTick", statKey: "current_tick", accent: "text-accent-secondary" as const },
  { key: "fact", statKey: null, accent: "text-text-secondary" as const },
  { key: "episode", statKey: null, accent: "text-text-secondary" as const },
  { key: "decision", statKey: null, accent: "text-text-secondary" as const },
  { key: "preference", statKey: null, accent: "text-text-secondary" as const },
]

export default function StatsCards({ stats, memories }: StatsCardsProps) {
  const t = useTranslations('stats')
  const tTypes = useTranslations('types')

  const factCount = memories.filter(m => m.mtype === "fact").length
  const episodeCount = memories.filter(m => m.mtype === "episode").length
  const decisionCount = memories.filter(m => m.mtype === "decision").length
  const preferenceCount = memories.filter(m => m.mtype === "preference").length

  const values: Record<string, number> = {
    num_memories: stats.num_memories,
    current_tick: stats.current_tick,
    fact: factCount,
    episode: episodeCount,
    decision: decisionCount,
    preference: preferenceCount,
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STAT_KEYS.map((item) => (
        <div key={item.key} className="stat-card">
          <div className="label mb-1">{t(item.key)}</div>
          <div className={`text-2xl font-bold ${item.accent}`}>
            {item.statKey ? values[item.statKey] : values[item.key]}
          </div>
        </div>
      ))}
    </div>
  )
}
