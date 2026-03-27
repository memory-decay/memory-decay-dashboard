import {
  Memory, SearchResult, SystemStats, HealthStatus, StoreRequest,
  StoreResponse, TickResponse, HistorySummary, HistoryTimelinePoint,
  ActivationRecord, DecayParams, DEFAULT_DECAY_PARAMS,
} from "./types"
import { MOCK_MEMORIES, MOCK_STATS } from "./mock-data"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ── Health & Stats ──────────────────────────────────────────

export async function getHealth(): Promise<HealthStatus> {
  try {
    return await apiFetch<HealthStatus>("/health")
  } catch {
    return { status: "offline", current_tick: MOCK_STATS.current_tick }
  }
}

export async function getStats(): Promise<SystemStats> {
  try {
    return await apiFetch<SystemStats>("/stats")
  } catch {
    return MOCK_STATS
  }
}

// ── Search ──────────────────────────────────────────────────

export async function searchMemories(query: string, topK: number = 10): Promise<SearchResult[]> {
  try {
    const data = await apiFetch<{ results: SearchResult[] }>("/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k: topK }),
    })
    return data.results
  } catch {
    // Fallback: simple text match on mock data
    const q = query.toLowerCase()
    return MOCK_MEMORIES
      .filter(m => m.text.toLowerCase().includes(q))
      .map(m => ({ ...m, score: 0.8 }))
  }
}

// ── Store ───────────────────────────────────────────────────

export async function storeMemory(req: StoreRequest): Promise<StoreResponse> {
  return apiFetch<StoreResponse>("/store", {
    method: "POST",
    body: JSON.stringify(req),
  })
}

// ── Tick ────────────────────────────────────────────────────

export async function advanceTick(count: number = 1): Promise<TickResponse> {
  return apiFetch<TickResponse>("/tick", {
    method: "POST",
    body: JSON.stringify({ count }),
  })
}

export async function autoTick(): Promise<TickResponse> {
  return apiFetch<TickResponse>("/auto-tick", {
    method: "POST",
  })
}

// ── Memory Operations ───────────────────────────────────────

export async function forgetMemory(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/forget/${id}`, {
    method: "DELETE",
  })
}

export async function resetMemories(): Promise<{ status: string; cleared: number }> {
  return apiFetch<{ status: string; cleared: number }>("/reset", {
    method: "POST",
  })
}

// ── All Memories (uses search with broad query) ─────────────

export async function getAllMemories(): Promise<Memory[]> {
  try {
    const data = await apiFetch<{ results: Memory[] }>("/search", {
      method: "POST",
      body: JSON.stringify({ query: "", top_k: 200 }),
    })
    return data.results
  } catch {
    return MOCK_MEMORIES
  }
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  try {
    const all = await getAllMemories()
    return all.find(m => m.id === id) || null
  } catch {
    return MOCK_MEMORIES.find(m => m.id === id) || null
  }
}

// ── Time-Series (Feature 1) ──────────────────────────────────

export async function getHistorySummary(): Promise<HistorySummary> {
  try {
    return await apiFetch<HistorySummary>("/admin/history/summary")
  } catch {
    // Mock fallback: generate synthetic timeline from mock data
    return generateMockHistorySummary()
  }
}

export async function getMemoryHistory(id: string): Promise<ActivationRecord[]> {
  try {
    return await apiFetch<ActivationRecord[]>(`/admin/memories/${id}/history`)
  } catch {
    // Mock fallback: simulate decay history for a memory
    const mem = MOCK_MEMORIES.find(m => m.id === id)
    return mem ? generateMockHistory(mem) : []
  }
}

// ── Decay Params (Feature 2) ────────────────────────────────

export async function getDecayParams(): Promise<DecayParams> {
  try {
    return await apiFetch<DecayParams>("/admin/decay-params")
  } catch {
    return { ...DEFAULT_DECAY_PARAMS }
  }
}

export async function updateDecayParams(params: Partial<DecayParams>): Promise<DecayParams> {
  return apiFetch<DecayParams>("/admin/decay-params", {
    method: "PUT",
    body: JSON.stringify(params),
  })
}

export async function getTickInterval(): Promise<{ interval: number }> {
  try {
    return await apiFetch<{ interval: number }>("/admin/tick-interval")
  } catch {
    return { interval: 3600 }
  }
}

export async function updateTickInterval(seconds: number): Promise<{ interval: number }> {
  return apiFetch<{ interval: number }>("/admin/tick-interval", {
    method: "PUT",
    body: JSON.stringify({ interval: seconds }),
  })
}

// ── Mock Generators ──────────────────────────────────────────

function generateMockHistorySummary(): HistorySummary {
  const memories = MOCK_MEMORIES
  const currentTick = MOCK_STATS.current_tick
  const ticks = 20
  const timeline: HistoryTimelinePoint[] = []

  for (let t = currentTick - ticks; t <= currentTick; t++) {
    const progress = (t - (currentTick - ticks)) / ticks
    timeline.push({
      tick: t,
      avg_retrieval: 0.7 - progress * 0.35 + (Math.random() * 0.04 - 0.02),
      avg_storage: 0.75 - progress * 0.3 + (Math.random() * 0.03 - 0.015),
      avg_stability: 0.2 + progress * 0.15 + (Math.random() * 0.02 - 0.01),
      at_risk_count: Math.floor(progress * memories.length * 0.4),
    })
  }

  const catMap: Record<string, { count: number; rSum: number; sSum: number; stSum: number }> = {}
  for (const m of memories) {
    if (!catMap[m.category]) catMap[m.category] = { count: 0, rSum: 0, sSum: 0, stSum: 0 }
    catMap[m.category].count++
    catMap[m.category].rSum += m.retrieval_score
    catMap[m.category].sSum += m.storage_score
    catMap[m.category].stSum += m.stability
  }

  return {
    total_memories: memories.length,
    current_tick: currentTick,
    categories: Object.entries(catMap).map(([category, v]) => ({
      category,
      count: v.count,
      avg_retrieval: v.rSum / v.count,
      avg_storage: v.sSum / v.count,
      avg_stability: v.stSum / v.count,
    })),
    timeline,
  }
}

function generateMockHistory(mem: Memory): ActivationRecord[] {
  const records: ActivationRecord[] = []
  const totalTicks = 20
  const startTick = Math.max(0, mem.created_tick)
  const now = Date.now()

  for (let i = 0; i <= totalTicks; i++) {
    const tick = startTick + i
    const progress = i / totalTicks
    const decay = mem.retrieval_score * Math.exp(-progress * 0.05)
    records.push({
      tick,
      retrieval_score: Math.max(0.01, decay),
      storage_score: Math.max(0.01, mem.storage_score * Math.exp(-progress * 0.03)),
      stability: Math.min(mem.stability + progress * 0.1, 1.0),
      recorded_at: now - (totalTicks - i) * 3600_000,
    })
  }
  return records
}
