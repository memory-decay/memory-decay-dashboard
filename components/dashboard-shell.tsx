"use client"

import { useMemo, useState } from "react"
import { Constellation } from "@/components/constellation"
import { DbPicker } from "@/components/db-picker"
import { FadingMemoriesPanel } from "@/components/fading-memories-panel"
import { MemoryDetailPanel } from "@/components/memory-detail-panel"
import { ReinforcedMemoriesPanel } from "@/components/reinforced-memories-panel"
import type { DerivedMemoryState } from "@/lib/types"

type SummaryPayload = {
  path: string
  meta: {
    currentTick: number
    memoryCount: number
    associationCount: number
  }
  fastestFading: DerivedMemoryState[]
  reinforcedSurvivors: DerivedMemoryState[]
  spotlight: DerivedMemoryState | null
  byId: Record<string, DerivedMemoryState>
}

const RECENT_PATHS_KEY = "memory-decay-dashboard:recent-paths"

function readRecentPaths() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENT_PATHS_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecentPaths(paths: string[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(paths.slice(0, 6)))
}

export function DashboardShell() {
  const [path, setPath] = useState("memory-decay/data/memories.db")
  const [data, setData] = useState<SummaryPayload | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentPaths, setRecentPaths] = useState<string[]>(() => readRecentPaths())

  const selectedMemory = useMemo(() => {
    if (!data) return null
    const id = selectedId ?? data.spotlight?.id ?? data.fastestFading[0]?.id ?? null
    return id ? data.byId[id] ?? null : null
  }, [data, selectedId])

  async function loadSummary() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/db/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load database")
      }

      setData(payload)
      setSelectedId(payload.spotlight?.id ?? payload.fastestFading[0]?.id ?? null)

      const nextRecent = [path, ...recentPaths.filter((item) => item !== path)]
      setRecentPaths(nextRecent)
      writeRecentPaths(nextRecent)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database")
      setData(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-6 px-5 py-8 lg:px-8">
      {/* Header */}
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="label">memory-decay-dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            Memory Decay Observatory
          </h1>
        </div>
        {data ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/70 px-3.5 py-1.5 font-mono text-xs text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-status-stable" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.5)" }} />
            {data.path.split("/").pop()}
          </div>
        ) : null}
      </section>

      <DbPicker value={path} onChange={setPath} onLoad={loadSummary} loading={loading} recentPaths={recentPaths} />

      {error ? (
        <section className="rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {/* Constellation Hero */}
      {data ? (
        <Constellation
          memories={data.byId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          currentTick={data.meta.currentTick}
          memoryCount={data.meta.memoryCount}
          associationCount={data.meta.associationCount}
          spotlightLabel={data.spotlight ? `${data.spotlight.id} — ${data.spotlight.explanation.summary}` : undefined}
          spotlightId={data.spotlight?.id}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_1.25fr]">
        <FadingMemoriesPanel
          memories={data?.fastestFading ?? []}
          selectedId={selectedId ?? undefined}
          onSelect={setSelectedId}
        />
        <ReinforcedMemoriesPanel
          memories={data?.reinforcedSurvivors ?? []}
          selectedId={selectedId ?? undefined}
          onSelect={setSelectedId}
        />
        <MemoryDetailPanel memory={selectedMemory} />
      </section>
    </main>
  )
}
