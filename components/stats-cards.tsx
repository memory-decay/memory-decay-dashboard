"use client"

import { SystemStats } from "@/lib/types"
import { Memory } from "@/lib/types"

interface StatsCardsProps {
  stats: SystemStats
  memories: Memory[]
}

export default function StatsCards({ stats, memories }: StatsCardsProps) {
  const factCount = memories.filter(m => m.mtype === "fact").length
  const episodeCount = memories.filter(m => m.mtype === "episode").length
  const decisionCount = memories.filter(m => m.mtype === "decision").length
  const preferenceCount = memories.filter(m => m.mtype === "preference").length

  const cards = [
    { label: "전체 메모리", value: stats.num_memories, accent: "text-accent" },
    { label: "현재 틱", value: stats.current_tick, accent: "text-accent-secondary" },
    { label: "사실", value: factCount, accent: "text-text-secondary" },
    { label: "에피소드", value: episodeCount, accent: "text-text-secondary" },
    { label: "결정", value: decisionCount, accent: "text-text-secondary" },
    { label: "선호", value: preferenceCount, accent: "text-text-secondary" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className="label mb-1">{card.label}</div>
          <div className={`text-2xl font-bold ${card.accent}`}>{card.value}</div>
        </div>
      ))}
    </div>
  )
}
