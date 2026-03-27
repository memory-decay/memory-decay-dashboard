"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts"
import { useTranslations } from "next-intl"
import { getAllMemories, getHistorySummary } from "@/lib/api"
import { Memory, HistorySummary, getFreshnessStatus, MTYPE_LABELS, CHART_TOOLTIP_STYLE } from "@/lib/types"
import Link from "next/link"
import StatusBadge from "@/components/status-badge"

const PIE_COLORS = ["#7c9cff", "#49dcb1", "#f5a65b", "#f87171"]

function buildHistogram(memories: Memory[]): { range: string; count: number }[] {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
    count: 0,
  }))
  for (const m of memories) {
    const idx = Math.min(Math.floor(m.retrieval_score * 10), 9)
    buckets[idx].count++
  }
  return buckets
}

function buildCategoryCounts(memories: Memory[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
  for (const m of memories) {
    const label = MTYPE_LABELS[m.mtype] || m.mtype
    counts[label] = (counts[label] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export default function AnalyticsPage() {
  const t = useTranslations('page.analytics')
  const [memories, setMemories] = useState<Memory[]>([])
  const [history, setHistory] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [m, h] = await Promise.all([getAllMemories(), getHistorySummary()])
      setMemories(m)
      setHistory(h)
      setLoading(false)
    }
    load()
  }, [])

  const histogram = useMemo(() => buildHistogram(memories), [memories])
  const categoryData = useMemo(() => buildCategoryCounts(memories), [memories])
  const atRisk = useMemo(
    () => [...memories].sort((a, b) => a.storage_score - b.storage_score).slice(0, 5),
    [memories]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('subtitle')}</p>
        {loading && <span className="text-xs text-text-muted ml-2">{t('loading')}</span>}
      </div>

      {/* ── Time-Series: System Timeline ──────────────────────── */}
      {history && history.timeline.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Average activation over time */}
          <div className="chart-section">
            <div className="label mb-3">{t('systemActivationTrend')}</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
                <XAxis dataKey="tick" stroke="#70809c" fontSize={10} tickLine={false} />
                <YAxis stroke="#70809c" fontSize={11} tickLine={false} domain={[0, 1]} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#70809c" }} />
                <Line type="monotone" dataKey="avg_retrieval" stroke="#7c9cff" strokeWidth={2} dot={false} name={t('avgRetrieval')} />
                <Line type="monotone" dataKey="avg_storage" stroke="#49dcb1" strokeWidth={2} dot={false} name={t('avgStorage')} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk count over time */}
          <div className="chart-section">
            <div className="label mb-3">{t('atRiskTrend')}</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={history.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
                <XAxis dataKey="tick" stroke="#70809c" fontSize={10} tickLine={false} />
                <YAxis stroke="#70809c" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone" dataKey="at_risk_count" stroke="#f87171" fill="#f8717120"
                  strokeWidth={2} name={t('atRiskCount')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Per-category decay comparison ─────────────────────── */}
      {history && history.categories.length > 0 && (
        <div className="chart-section">
          <div className="label mb-3">{t('categoryComparison')}</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={history.categories}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
              <XAxis dataKey="category" stroke="#70809c" fontSize={10} tickLine={false} />
              <YAxis stroke="#70809c" fontSize={11} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#70809c" }} />
              <Bar dataKey="avg_retrieval" fill="#7c9cff" radius={[3, 3, 0, 0]} name={t('retrievalScore')} />
              <Bar dataKey="avg_storage" fill="#49dcb1" radius={[3, 3, 0, 0]} name={t('storageScore')} />
              <Bar dataKey="avg_stability" fill="#f5a65b" radius={[3, 3, 0, 0]} name={t('stability')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Original charts ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activation score histogram */}
        <div className="chart-section">
          <div className="label mb-3">{t('activationDistribution')}</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histogram} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
              <XAxis dataKey="range" stroke="#70809c" fontSize={10} tickLine={false} />
              <YAxis stroke="#70809c" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#7c9cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="chart-section">
          <div className="label mb-3">{t('typeBreakdown')}</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                  paddingAngle={3} dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-text-secondary">{cat.name}</span>
                  <span className="font-mono text-text-muted">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* At-risk memories */}
      <div className="panel p-5">
        <div className="label mb-3">{t('atRiskMemories')}</div>
        <p className="mb-4 text-xs text-text-muted">{t('atRiskDescription')}</p>
        <div className="space-y-2">
          {atRisk.map((m) => (
            <Link
              key={m.id}
              href={`/memory/${m.id}`}
              className="memory-row flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-text-primary">{m.text}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                  <span>{m.category}</span>
                  <span className="font-mono">{t('storage')}: {m.storage_score.toFixed(3)}</span>
                </div>
              </div>
              <StatusBadge status={getFreshnessStatus(m.freshness)} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
