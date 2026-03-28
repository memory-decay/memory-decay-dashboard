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

// SearchResult matches what the /search API actually returns
export interface SearchResult {
  id: string
  text: string
  score: number
  storage_score: number
  retrieval_score: number
  category: string
  mtype: string
  created_tick: number
  speaker?: string
  importance?: number
  stability?: number
  freshness?: number
  associations?: string[]
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
  mtype: Memory["mtype"]
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
    case "fresh": return "freshness.fresh"
    case "normal": return "freshness.normal"
    case "stale": return "freshness.stale"
  }
}

// ── Time-Series (Feature 1) ──────────────────────────────────

export interface HistoryTimelinePoint {
  tick: number
  avg_retrieval: number
  avg_storage: number
  avg_stability: number
  at_risk_count: number
}

export interface HistoryCategorySummary {
  category: string
  count: number
  avg_retrieval: number
  avg_storage: number
  avg_stability: number
}

export interface HistorySummary {
  total_memories: number
  current_tick: number
  categories: HistoryCategorySummary[]
  timeline: HistoryTimelinePoint[]
}

export interface ActivationRecord {
  tick: number
  retrieval_score: number
  storage_score: number
  stability: number
  recorded_at: number
}

// ── Shared UI Constants ────────────────────────────────────

export const MTYPE_LABELS: Record<string, string> = {
  fact: "memoryType.fact",
  episode: "memoryType.episode",
  decision: "memoryType.decision",
  preference: "memoryType.preference",
}

// ── Decay Params (Feature 2) ────────────────────────────────

export interface DecayParams {
  lambda_fact: number
  lambda_episode: number
  beta_fact: number
  beta_episode: number
  alpha: number
  stability_weight: number
  stability_decay: number
  stability_cap: number
  reinforcement_gain_direct: number
  reinforcement_gain_assoc: number
  floor_min: number
  floor_max: number
  floor_power: number
  gate_center: number
  gate_width: number
  min_rate_scale: number
  consolidation_gain: number
}

export const DEFAULT_DECAY_PARAMS: DecayParams = {
  lambda_fact: 0.02,
  lambda_episode: 0.035,
  beta_fact: 0.08,
  beta_episode: 0.12,
  alpha: 0.5,
  stability_weight: 0.8,
  stability_decay: 0.01,
  stability_cap: 1.0,
  reinforcement_gain_direct: 0.2,
  reinforcement_gain_assoc: 0.05,
  floor_min: 0.05,
  floor_max: 0.35,
  floor_power: 2.0,
  gate_center: 0.4,
  gate_width: 0.08,
  min_rate_scale: 0.1,
  consolidation_gain: 0.6,
}

export interface DecayParamMeta {
  key: keyof DecayParams
  label: string
  group: "basic" | "stability" | "reinforcement" | "soft_floor"
  min: number
  max: number
  step: number
}

export const DECAY_PARAM_GROUPS: { label: string; group: DecayParamMeta["group"]; params: DecayParamMeta[] }[] = [
  {
    label: "decayParamGroup.basic",
    group: "basic",
    params: [
      { key: "lambda_fact", label: "decayParam.lambda_fact", group: "basic", min: 0.001, max: 0.1, step: 0.001 },
      { key: "lambda_episode", label: "decayParam.lambda_episode", group: "basic", min: 0.001, max: 0.1, step: 0.001 },
      { key: "alpha", label: "decayParam.alpha", group: "basic", min: 0.0, max: 2.0, step: 0.05 },
    ],
  },
  {
    label: "decayParamGroup.stability",
    group: "stability",
    params: [
      { key: "stability_weight", label: "decayParam.stability_weight", group: "stability", min: 0.0, max: 2.0, step: 0.05 },
      { key: "stability_decay", label: "decayParam.stability_decay", group: "stability", min: 0.0, max: 0.1, step: 0.005 },
      { key: "stability_cap", label: "decayParam.stability_cap", group: "stability", min: 0.5, max: 2.0, step: 0.1 },
    ],
  },
  {
    label: "decayParamGroup.reinforcement",
    group: "reinforcement",
    params: [
      { key: "reinforcement_gain_direct", label: "decayParam.reinforcement_gain_direct", group: "reinforcement", min: 0.0, max: 1.0, step: 0.01 },
      { key: "reinforcement_gain_assoc", label: "decayParam.reinforcement_gain_assoc", group: "reinforcement", min: 0.0, max: 0.5, step: 0.01 },
      { key: "consolidation_gain", label: "decayParam.consolidation_gain", group: "reinforcement", min: 0.0, max: 1.0, step: 0.05 },
    ],
  },
  {
    label: "decayParamGroup.soft_floor",
    group: "soft_floor",
    params: [
      { key: "floor_min", label: "decayParam.floor_min", group: "soft_floor", min: 0.0, max: 0.2, step: 0.01 },
      { key: "floor_max", label: "decayParam.floor_max", group: "soft_floor", min: 0.1, max: 0.5, step: 0.01 },
      { key: "floor_power", label: "decayParam.floor_power", group: "soft_floor", min: 0.5, max: 5.0, step: 0.1 },
      { key: "gate_center", label: "decayParam.gate_center", group: "soft_floor", min: 0.0, max: 1.0, step: 0.05 },
      { key: "gate_width", label: "decayParam.gate_width", group: "soft_floor", min: 0.01, max: 0.5, step: 0.01 },
      { key: "min_rate_scale", label: "decayParam.min_rate_scale", group: "soft_floor", min: 0.0, max: 0.5, step: 0.01 },
    ],
  },
]
