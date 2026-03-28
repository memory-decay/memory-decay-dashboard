"use client"

import { SystemStats } from "@/lib/types"
import { Memory } from "@/lib/types"
import { useTranslations } from "next-intl"
import { Brain, Clock, FileText, Zap, Star, Heart } from "lucide-react"

interface StatsCardsProps {
  stats: SystemStats
  memories: Memory[]
}

// Stat configuration with distinct accent colors and colored borders for visual hierarchy
const STAT_CONFIG = [
  {
    key: "totalMemories",
    statKey: "num_memories",
    icon: Brain,
    accent: "text-accent" as const,
    bgAccent: "bg-accent/10",
    borderAccent: "border-accent",
    headerBg: "bg-accent/15",
  },
  {
    key: "currentTick",
    statKey: "current_tick",
    icon: Clock,
    accent: "text-accent-secondary" as const,
    bgAccent: "bg-accent-secondary/10",
    borderAccent: "border-accent-secondary",
    headerBg: "bg-accent-secondary/15",
  },
  {
    key: "fact",
    statKey: null,
    icon: FileText,
    accent: "text-accent-orange" as const,
    bgAccent: "bg-accent-orange/10",
    borderAccent: "border-accent-orange",
    headerBg: "bg-accent-orange/15",
  },
  {
    key: "episode",
    statKey: null,
    icon: Zap,
    accent: "text-accent-warm" as const,
    bgAccent: "bg-accent-warm/10",
    borderAccent: "border-accent-warm",
    headerBg: "bg-accent-warm/15",
  },
  {
    key: "decision",
    statKey: null,
    icon: Star,
    accent: "text-status-stable" as const,
    bgAccent: "bg-status-stable/10",
    borderAccent: "border-status-stable",
    headerBg: "bg-status-stable/15",
  },
  {
    key: "preference",
    statKey: null,
    icon: Heart,
    accent: "text-status-info" as const,
    bgAccent: "bg-status-info/10",
    borderAccent: "border-status-info",
    headerBg: "bg-status-info/15",
  },
]

export default function StatsCards({ stats, memories }: StatsCardsProps) {
  const t = useTranslations('stats')

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
      {STAT_CONFIG.map((item) => {
        const Icon = item.icon
        const value = item.statKey ? values[item.statKey] : values[item.key]

        return (
          <div
            key={item.key}
            className={`stat-card group transition-all hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 border-3 ${item.borderAccent}`}
          >
            <div className={`flex items-center gap-2 mb-2 pb-2 border-b-2 ${item.borderAccent} ${item.headerBg}`}>
              <div className={`flex h-7 w-7 items-center justify-center ${item.bgAccent} border-2 ${item.borderAccent}`}>
                <Icon size={14} className={item.accent} strokeWidth={2.5} />
              </div>
              <div className="label">{t(item.key)}</div>
            </div>
            <div className={`text-2xl font-black ${item.accent}`}>
              {value.toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
