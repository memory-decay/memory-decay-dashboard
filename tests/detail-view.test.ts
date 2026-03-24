import test from "node:test"
import assert from "node:assert/strict"
import { deriveDashboardState } from "@/lib/insights/derive-state"

test("deriveDashboardState exposes association context for the memory detail view", () => {
  const result = deriveDashboardState({
    currentTick: 20,
    memories: [
      {
        id: "focus",
        content: "primary memory",
        mtype: "episode",
        importance: 0.7,
        speaker: "user",
        created_tick: 2,
        storage_score: 0.7,
        retrieval_score: 0.6,
        stability_score: 0.5,
        last_activated_tick: 10,
        last_reinforced_tick: 11,
        retrieval_count: 3,
      },
      {
        id: "neighbor",
        content: "related memory",
        mtype: "fact",
        importance: 0.6,
        speaker: "assistant",
        created_tick: 4,
        storage_score: 0.8,
        retrieval_score: 0.75,
        stability_score: 0.55,
        last_activated_tick: 12,
        last_reinforced_tick: 12,
        retrieval_count: 2,
      },
    ],
    associations: [{ source_id: "focus", target_id: "neighbor", weight: 0.65, created_tick: 4 }],
  })

  assert.equal(result.byId["focus"]?.associations[0]?.targetId, "neighbor")
  assert.equal(result.byId["focus"]?.associations[0]?.weight, 0.65)
})
