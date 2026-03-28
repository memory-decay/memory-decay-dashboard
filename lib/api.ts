import {
  Memory, SearchResult, SystemStats, HealthStatus, StoreRequest,
  StoreResponse, TickResponse, HistorySummary,
  ActivationRecord, DecayParams,
} from "./types"

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
  return await apiFetch<HealthStatus>("/health")
}

export async function getStats(): Promise<SystemStats> {
  const data = await apiFetch<{ num_memories: number; current_tick: number; last_tick_time: number }>("/stats")
  return {
    num_memories: data.num_memories,
    current_tick: data.current_tick,
    last_tick_time: new Date(data.last_tick_time * 1000).toISOString(),
  }
}

// ── Search ──────────────────────────────────────────────────

export async function searchMemories(query: string, topK: number = 10): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>("/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  })
  return data.results
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

// ── Memory Operations ────────────────────────────────────────

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

// ── All Memories ──────────────────────────────────────────────

export async function getAllMemories(): Promise<Memory[]> {
  const data = await apiFetch<{
    memories: Array<{
      id: string
      content: string
      mtype: string
      category: string
      importance: number
      speaker: string
      created_tick: number
      storage_score: number
      retrieval_score: number
      stability: number
      last_activated_tick: number
      retrieval_count: number
    }>
  }>("/admin/memories?per_page=50")
  return data.memories.map(m => ({
    id: m.id,
    text: m.content,
    importance: m.importance,
    mtype: m.mtype as Memory["mtype"],
    category: m.category,
    created_tick: m.created_tick,
    retrieval_score: m.retrieval_score,
    storage_score: m.storage_score,
    stability: m.stability,
    freshness: 1,
    associations: [] as string[],
    speaker: m.speaker,
  }))
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  try {
    const data = await apiFetch<{
      id: string
      content: string
      mtype: string
      category: string
      importance: number
      speaker: string
      created_tick: number
      storage_score: number
      retrieval_score: number
      stability: number
    }>(`/admin/memories/${id}`)
    return {
      id: data.id,
      text: data.content,
      importance: data.importance,
      mtype: data.mtype as Memory["mtype"],
      category: data.category,
      created_tick: data.created_tick,
      retrieval_score: data.retrieval_score,
      storage_score: data.storage_score,
      stability: data.stability,
      freshness: 1,
      associations: [],
      speaker: data.speaker,
    }
  } catch {
    return null
  }
}

// ── Time-Series (Feature 1) ──────────────────────────────────

export async function getHistorySummary(): Promise<HistorySummary> {
  return await apiFetch<HistorySummary>("/admin/history/summary")
}

export async function getMemoryHistory(id: string): Promise<ActivationRecord[]> {
  return await apiFetch<ActivationRecord[]>(`/admin/memories/${id}/history`)
}

// ── Decay Params (Feature 2) ────────────────────────────────

export async function getDecayParams(): Promise<DecayParams> {
  return await apiFetch<DecayParams>("/admin/decay-params")
}

export async function updateDecayParams(params: Partial<DecayParams>): Promise<DecayParams> {
  return apiFetch<DecayParams>("/admin/decay-params", {
    method: "PUT",
    body: JSON.stringify(params),
  })
}

export async function getTickInterval(): Promise<{ interval: number }> {
  return await apiFetch<{ interval: number }>("/admin/tick-interval")
}

export async function updateTickInterval(seconds: number): Promise<{ interval: number }> {
  return apiFetch<{ interval: number }>("/admin/tick-interval", {
    method: "PUT",
    body: JSON.stringify({ interval: seconds }),
  })
}
