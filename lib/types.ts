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
    case "fresh": return "신선"
    case "normal": return "보통"
    case "stale": return "소멸 위험"
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
  fact: "사실",
  episode: "에피소드",
  decision: "결정",
  preference: "선호",
}

export const CHART_TOOLTIP_STYLE = {
  background: "#151821",
  border: "1px solid #263042",
  borderRadius: 8,
  fontSize: 12,
  color: "#f8fafc",
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
    label: "기본 감쇠",
    group: "basic",
    params: [
      { key: "lambda_fact", label: "사실 감쇠율 (λ_fact)", group: "basic", min: 0.001, max: 0.1, step: 0.001 },
      { key: "lambda_episode", label: "에피소드 감쇠율 (λ_episode)", group: "basic", min: 0.001, max: 0.1, step: 0.001 },
      { key: "alpha", label: "임팩트 가중치 (α)", group: "basic", min: 0.0, max: 2.0, step: 0.05 },
    ],
  },
  {
    label: "안정성",
    group: "stability",
    params: [
      { key: "stability_weight", label: "안정성 가중치 (ρ)", group: "stability", min: 0.0, max: 2.0, step: 0.05 },
      { key: "stability_decay", label: "안정성 감쇠", group: "stability", min: 0.0, max: 0.1, step: 0.005 },
      { key: "stability_cap", label: "안정성 상한", group: "stability", min: 0.5, max: 2.0, step: 0.1 },
    ],
  },
  {
    label: "강화",
    group: "reinforcement",
    params: [
      { key: "reinforcement_gain_direct", label: "직접 강화 게인", group: "reinforcement", min: 0.0, max: 1.0, step: 0.01 },
      { key: "reinforcement_gain_assoc", label: "연관 강화 게인", group: "reinforcement", min: 0.0, max: 0.5, step: 0.01 },
      { key: "consolidation_gain", label: "통합 게인", group: "reinforcement", min: 0.0, max: 1.0, step: 0.05 },
    ],
  },
  {
    label: "Soft-Floor",
    group: "soft_floor",
    params: [
      { key: "floor_min", label: "바닥 최소값", group: "soft_floor", min: 0.0, max: 0.2, step: 0.01 },
      { key: "floor_max", label: "바닥 최대값", group: "soft_floor", min: 0.1, max: 0.5, step: 0.01 },
      { key: "floor_power", label: "바닥 지수", group: "soft_floor", min: 0.5, max: 5.0, step: 0.1 },
      { key: "gate_center", label: "게이트 중심", group: "soft_floor", min: 0.0, max: 1.0, step: 0.05 },
      { key: "gate_width", label: "게이트 폭", group: "soft_floor", min: 0.01, max: 0.5, step: 0.01 },
      { key: "min_rate_scale", label: "최소 비율 스케일", group: "soft_floor", min: 0.0, max: 0.5, step: 0.01 },
    ],
  },
]
