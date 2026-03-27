"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts"
import { getAllMemories, getHistorySummary } from "@/lib/api"
import { Memory, HistorySummary, getFreshnessStatus } from "@/lib/types"
import { MOCK_MEMORIES } from "@/lib/mock-data"
import Link from "next/link"
import StatusBadge from "@/components/status-badge"

const MTYPE_LABELS: Record<string, string> = {
  fact: "사실",
  episode: "에피소드",
  decision: "결정",
  preference: "선호",
}

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

const CHART_TOOLTIP_STYLE = {
  background: "#151821",
  border: "1px solid #263042",
  borderRadius: 8,
  fontSize: 12,
  color: "#f8fafc",
}

export default function AnalyticsPage() {
  const [memories, setMemories] = useState<Memory[]>(MOCK_MEMORIES)
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

  const histogram = buildHistogram(memories)
  const categoryData = buildCategoryCounts(memories)
  const atRisk = [...memories]
    .sort((a, b) => a.storage_score - b.storage_score)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">분석</h1>
        <p className="text-sm text-text-muted">메모리 감쇠 분석 및 통계</p>
        {loading && <span className="text-xs text-text-muted ml-2">불러오는 중...</span>}
      </div>

      {/* ── Time-Series: System Timeline ──────────────────────── */}
      {history && history.timeline.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Average activation over time */}
          <div className="chart-section">
            <div className="label mb-3">시스템 활성도 추이</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
                <XAxis dataKey="tick" stroke="#70809c" fontSize={10} tickLine={false} />
                <YAxis stroke="#70809c" fontSize={11} tickLine={false} domain={[0, 1]} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#70809c" }} />
                <Line type="monotone" dataKey="avg_retrieval" stroke="#7c9cff" strokeWidth={2} dot={false} name="검색 평균" />
                <Line type="monotone" dataKey="avg_storage" stroke="#49dcb1" strokeWidth={2} dot={false} name="저장 평균" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk count over time */}
          <div className="chart-section">
            <div className="label mb-3">소멸 위험 메모리 수 추이</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={history.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
                <XAxis dataKey="tick" stroke="#70809c" fontSize={10} tickLine={false} />
                <YAxis stroke="#70809c" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone" dataKey="at_risk_count" stroke="#f87171" fill="#f8717120"
                  strokeWidth={2} name="위험 메모리 수"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Per-category decay comparison ─────────────────────── */}
      {history && history.categories.length > 0 && (
        <div className="chart-section">
          <div className="label mb-3">카테고리별 활성도 비교</div>
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
              <Bar dataKey="avg_retrieval" fill="#7c9cff" radius={[3, 3, 0, 0]} name="검색 점수" />
              <Bar dataKey="avg_storage" fill="#49dcb1" radius={[3, 3, 0, 0]} name="저장 점수" />
              <Bar dataKey="avg_stability" fill="#f5a65b" radius={[3, 3, 0, 0]} name="안정성" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Original charts ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activation score histogram */}
        <div className="chart-section">
          <div className="label mb-3">활성도 분포</div>
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
          <div className="label mb-3">유형별 분류</div>
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
        <div className="label mb-3">소멸 위험 메모리</div>
        <p className="mb-4 text-xs text-text-muted">저장 점수가 가장 낮은 메모리 (곧 잊혀질 수 있음)</p>
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
                  <span className="font-mono">저장: {m.storage_score.toFixed(3)}</span>
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
