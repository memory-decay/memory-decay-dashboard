import type { DerivedMemoryState } from "@/lib/types"

function round(value: number) {
  return Math.round(value * 100) / 100
}

export function buildMemoryExplanation(memory: DerivedMemoryState) {
  const fading = memory.fadeRiskScore >= memory.reinforcementLiftScore

  if (fading) {
    return {
      summary: `Current decay state suggests this memory is fading: storage ${round(memory.storage_score)}, retrieval ${round(memory.retrieval_score)}, inactive for ${memory.inactiveTicks} ticks.`,
      bullets: [
        `Storage score is low at ${round(memory.storage_score)}, so the persisted trace is already weak.`,
        `Retrieval score is ${round(memory.retrieval_score)} after ${memory.inactiveTicks} inactive ticks.`,
        `Stability is ${round(memory.stability_score)} — it still matters, but the visible decay state is dominated by storage and retrieval.`,
      ],
    }
  }

  return {
    summary: `Current decay state suggests this memory is still preserved: storage ${round(memory.storage_score)}, retrieval ${round(memory.retrieval_score)}, inactive for ${memory.inactiveTicks} ticks.`,
    bullets: [
      `Storage score remains high at ${round(memory.storage_score)}, so the memory has not decayed much yet.`,
      `Retrieval score is ${round(memory.retrieval_score)}, meaning it is still accessible right now.`,
      `Stability is ${round(memory.stability_score)} as a supporting signal, but the main visible decay scores are storage and retrieval.`,
    ],
  }
}
