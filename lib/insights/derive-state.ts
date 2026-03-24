import { buildMemoryExplanation } from "@/lib/insights/explanations"
import type {
  AssociationRecord,
  DashboardState,
  DerivedMemoryState,
  MemoryAssociationSummary,
  MemoryRecord,
} from "@/lib/types"

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000
}

export function deriveDashboardState({
  currentTick,
  memories,
  associations,
}: {
  currentTick: number
  memories: MemoryRecord[]
  associations: AssociationRecord[]
}): DashboardState {
  const tickScale = Math.max(currentTick, 1)
  const previewById = Object.fromEntries(
    memories.map((memory) => [memory.id, memory.content.slice(0, 140)]),
  )

  const associationsBySource = associations.reduce<Record<string, MemoryAssociationSummary[]>>(
    (acc, association) => {
      if (!acc[association.source_id]) {
        acc[association.source_id] = []
      }

      acc[association.source_id].push({
        targetId: association.target_id,
        weight: association.weight,
        createdTick: association.created_tick,
        targetPreview: previewById[association.target_id],
      })
      return acc
    },
    {},
  )

  const byId: Record<string, DerivedMemoryState> = {}

  for (const memory of memories) {
    const ageTicks = Math.max(currentTick - memory.created_tick, 0)
    const lastTouch = Math.max(memory.last_activated_tick, memory.last_reinforced_tick, memory.created_tick)
    const inactiveTicks = Math.max(currentTick - lastTouch, 0)

    const fadeRiskScore = clamp01(
      (1 - memory.storage_score) * 0.28 +
        (1 - memory.retrieval_score) * 0.24 +
        (1 - memory.stability_score) * 0.2 +
        clamp01(inactiveTicks / tickScale) * 0.18 +
        clamp01(ageTicks / tickScale) * 0.05 +
        (1 - memory.importance) * 0.05,
    )

    const reinforcementLiftScore = clamp01(
      memory.stability_score * 0.3 +
        memory.retrieval_score * 0.23 +
        memory.storage_score * 0.12 +
        clamp01(memory.retrieval_count / 10) * 0.2 +
        clamp01((tickScale - inactiveTicks) / tickScale) * 0.15,
    )

    const derived: DerivedMemoryState = {
      ...memory,
      ageTicks,
      inactiveTicks,
      fadeRiskScore: round4(fadeRiskScore),
      reinforcementLiftScore: round4(reinforcementLiftScore),
      explanation: { summary: "", bullets: [] },
      associations: (associationsBySource[memory.id] ?? []).sort((a, b) => b.weight - a.weight),
    }

    derived.explanation = buildMemoryExplanation(derived)
    byId[memory.id] = derived
  }

  const values = Object.values(byId)
  const fastestFading = [...values].sort((a, b) => {
    if (a.storage_score !== b.storage_score) {
      return a.storage_score - b.storage_score
    }
    if (a.retrieval_score !== b.retrieval_score) {
      return a.retrieval_score - b.retrieval_score
    }
    return b.inactiveTicks - a.inactiveTicks
  })

  const reinforcedSurvivors = [...values].sort((a, b) => {
    if (a.storage_score !== b.storage_score) {
      return b.storage_score - a.storage_score
    }
    if (a.retrieval_score !== b.retrieval_score) {
      return b.retrieval_score - a.retrieval_score
    }
    return a.inactiveTicks - b.inactiveTicks
  })

  const spotlight =
    [...values].sort((a, b) => {
      const aScore = Math.max(a.fadeRiskScore, a.reinforcementLiftScore)
      const bScore = Math.max(b.fadeRiskScore, b.reinforcementLiftScore)
      return bScore - aScore
    })[0] ?? null

  return {
    currentTick,
    byId,
    fastestFading,
    reinforcedSurvivors,
    spotlight,
  }
}
