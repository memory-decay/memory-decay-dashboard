export interface Memory {
  id: string
  text: string
  importance: number
  mtype: "fact" | "episode" | "decision" | "preference"
  category: string
  created_tick: number
  retrieval_score: number
  storage_score: number
  stability: number
  freshness: number
  associations: string[]
  speaker?: string
}

export interface SearchResult extends Memory {
  score: number
}

export interface SystemStats {
  num_memories: number
  current_tick: number
  last_tick_time: string
}

export interface HealthStatus {
  status: string
  current_tick: number
}

export interface StoreRequest {
  text: string
  importance: number
  mtype: string
  category: string
  associations?: string[]
  created_tick?: number
  speaker?: string
}

export interface StoreResponse {
  id: string
  text: string
  tick: number
}

export interface TickResponse {
  current_tick: number
  ticks_applied?: number
  elapsed_seconds?: number
}

export type SortField = "importance" | "retrieval_score" | "created_tick" | "category" | "storage_score"
export type SortDirection = "asc" | "desc"

export type FreshnessStatus = "fresh" | "normal" | "stale"

export function getFreshnessStatus(freshness: number): FreshnessStatus {
  if (freshness >= 0.7) return "fresh"
  if (freshness >= 0.3) return "normal"
  return "stale"
}

export function getFreshnessLabel(status: FreshnessStatus): string {
  switch (status) {
    case "fresh": return "신선"
    case "normal": return "보통"
    case "stale": return "소멸 위험"
  }
}
