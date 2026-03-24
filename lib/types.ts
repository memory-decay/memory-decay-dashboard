export type MemoryRecord = {
  id: string
  content: string
  mtype: string
  importance: number
  speaker: string
  created_tick: number
  storage_score: number
  retrieval_score: number
  stability_score: number
  last_activated_tick: number
  last_reinforced_tick: number
  retrieval_count: number
}

export type AssociationRecord = {
  source_id: string
  target_id: string
  weight: number
  created_tick: number
}

export type MemoryAssociationSummary = {
  targetId: string
  weight: number
  createdTick: number
  targetPreview?: string
}

export type MemoryExplanation = {
  summary: string
  bullets: string[]
}

export type DerivedMemoryState = MemoryRecord & {
  ageTicks: number
  inactiveTicks: number
  fadeRiskScore: number
  reinforcementLiftScore: number
  explanation: MemoryExplanation
  associations: MemoryAssociationSummary[]
}

export type DashboardState = {
  currentTick: number
  byId: Record<string, DerivedMemoryState>
  fastestFading: DerivedMemoryState[]
  reinforcedSurvivors: DerivedMemoryState[]
  spotlight: DerivedMemoryState | null
}
