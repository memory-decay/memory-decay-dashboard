import test from "node:test"
import assert from "node:assert/strict"
import { deriveDashboardState } from "@/lib/insights/derive-state"

test("deriveDashboardState ranks memories by actual storage decay state and explains them without reinforcement-first language", () => {
  const result = deriveDashboardState({
    currentTick: 50,
    memories: [
      {
        id: "fade-me",
        content: "thin trace",
        mtype: "episode",
        importance: 0.2,
        speaker: "",
        created_tick: 2,
        storage_score: 0.12,
        retrieval_score: 0.18,
        stability_score: 0.05,
        last_activated_tick: 5,
        last_reinforced_tick: 5,
        retrieval_count: 0,
      },
      {
        id: "survivor",
        content: "still alive",
        mtype: "fact",
        importance: 0.9,
        speaker: "",
        created_tick: 3,
        storage_score: 0.92,
        retrieval_score: 0.88,
        stability_score: 0.84,
        last_activated_tick: 44,
        last_reinforced_tick: 45,
        retrieval_count: 8,
      },
      {
        id: "reinforced-but-not-most-preserved",
        content: "reactivated often but storage is lower",
        mtype: "fact",
        importance: 0.8,
        speaker: "",
        created_tick: 4,
        storage_score: 0.63,
        retrieval_score: 0.95,
        stability_score: 0.95,
        last_activated_tick: 49,
        last_reinforced_tick: 49,
        retrieval_count: 10,
      },
    ],
    associations: [],
  })

  assert.equal(result.fastestFading[0]?.id, "fade-me")
  assert.equal(result.reinforcedSurvivors[0]?.id, "survivor")
  assert.match(result.byId["survivor"]?.explanation.summary ?? "", /preserved/i)
  assert.doesNotMatch(result.byId["survivor"]?.explanation.summary ?? "", /retrieval count/i)
  assert.match(result.byId["fade-me"]?.explanation.summary ?? "", /fading/i)
})
