import test from "node:test"
import assert from "node:assert/strict"
import {
  DECAY_SCORE_LABEL,
  DECAY_SCORE_RANKING_BADGE,
  RECALL_SCORE_LABEL,
} from "@/lib/ui-labels"

test("dashboard score terminology uses decay/recall wording", () => {
  assert.equal(DECAY_SCORE_LABEL, "Decay score")
  assert.equal(RECALL_SCORE_LABEL, "Recall score")
  assert.equal(DECAY_SCORE_RANKING_BADGE, "Ranked by decay score")
})
