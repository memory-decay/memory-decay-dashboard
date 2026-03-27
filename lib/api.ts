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
  return await apiFetch<SystemStats>("/stats")
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

// ── All Memories (uses search with broad query) ─────────────

export async function getAllMemories(): Promise<Memory[]> {
  const data = await apiFetch<{ results: Memory[] }>("/search", {
    method: "POST",
    body: JSON.stringify({ query: "", top_k: 200 }),
  })
  return data.results
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  const all = await getAllMemories()
  return all.find(m => m.id === id) || null
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
