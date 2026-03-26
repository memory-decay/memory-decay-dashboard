import { Memory, SearchResult, SystemStats, HealthStatus, StoreRequest, StoreResponse, TickResponse } from "./types"
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
