import test from "node:test"
import assert from "node:assert/strict"
import {
  sigmoidGate,
  softFloorDecayStep,
  computeFloor,
  projectForward,
  DEFAULT_DECAY_PARAMS,
  svgPathFromPoints,
} from "@/lib/decay-curve"
import type { DerivedMemoryState } from "@/lib/types"

test("sigmoidGate returns ~0.5 at center", () => {
  const result = sigmoidGate(0.4, 0.4, 0.08)
  assert.ok(Math.abs(result - 0.5) < 0.001, `expected ~0.5, got ${result}`)
})

test("sigmoidGate returns ~1.0 well above center", () => {
  const result = sigmoidGate(0.9, 0.4, 0.08)
  assert.ok(result > 0.99, `expected >0.99, got ${result}`)
})

test("sigmoidGate returns ~0.0 well below center", () => {
  const result = sigmoidGate(0.1, 0.4, 0.08)
  assert.ok(result < 0.01, `expected <0.01, got ${result}`)
})

test("computeFloor matches Python: impact=0.6", () => {
  const floor = computeFloor(0.6, 1.0, DEFAULT_DECAY_PARAMS)
  assert.ok(Math.abs(floor - 0.158) < 0.001, `expected ~0.158, got ${floor}`)
})

test("computeFloor clamps to activation", () => {
  const floor = computeFloor(0.9, 0.05, DEFAULT_DECAY_PARAMS)
  assert.ok(floor <= 0.05, `expected floor <= 0.05, got ${floor}`)
})

test("softFloorDecayStep decreases activation", () => {
  const result = softFloorDecayStep(0.8, 0.5, 0.3, {
    ...DEFAULT_DECAY_PARAMS,
    lam: 0.02,
  })
  assert.ok(result < 0.8, `expected < 0.8, got ${result}`)
  assert.ok(result > 0, `expected > 0, got ${result}`)
})

test("softFloorDecayStep never goes below floor", () => {
  let activation = 1.0
  const params = { ...DEFAULT_DECAY_PARAMS, lam: 0.035 }
  const floor = computeFloor(0.3, activation, DEFAULT_DECAY_PARAMS)
  for (let i = 0; i < 500; i++) {
    activation = softFloorDecayStep(activation, 0.3, 0.0, params)
  }
  assert.ok(activation >= 0.077 - 0.001, `expected >= ~0.077, got ${activation}`)
})

test("softFloorDecayStep returns 0 for activation=0", () => {
  const result = softFloorDecayStep(0.0, 0.5, 0.5, {
    ...DEFAULT_DECAY_PARAMS,
    lam: 0.02,
  })
  assert.equal(result, 0.0)
})

test("projectForward returns correct length", () => {
  const memory = makeMockMemory({ storage_score: 0.5, retrieval_score: 0.6 })
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, 50)
  assert.equal(points.length, 51)
})

test("projectForward first point matches current scores", () => {
  const memory = makeMockMemory({ storage_score: 0.42, retrieval_score: 0.65 })
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, 10)
  assert.ok(Math.abs(points[0].storage - 0.42) < 0.001, `expected storage ~0.42, got ${points[0].storage}`)
  assert.ok(Math.abs(points[0].retrieval - 0.65) < 0.001, `expected retrieval ~0.65, got ${points[0].retrieval}`)
})

test("projectForward scores decrease monotonically", () => {
  const memory = makeMockMemory({ storage_score: 0.8, retrieval_score: 0.9 })
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, 100)
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i].storage <= points[i - 1].storage + 1e-9, `storage increased at tick ${i}`)
    assert.ok(points[i].retrieval <= points[i - 1].retrieval + 1e-9, `retrieval increased at tick ${i}`)
  }
})

test("svgPathFromPoints generates valid d attribute", () => {
  const points = [
    { tick: 0, storage: 1.0, retrieval: 0.8 },
    { tick: 1, storage: 0.9, retrieval: 0.7 },
    { tick: 2, storage: 0.8, retrieval: 0.6 },
  ]
  const d = svgPathFromPoints(points, (p) => p.storage, { x: 50, y: 10, width: 560, height: 160, maxTick: 2 })
  assert.ok(d.startsWith("M"), `expected path to start with M, got: ${d}`)
  assert.ok(d.includes("L"), `expected path to include L commands`)
})

function makeMockMemory(overrides: Partial<DerivedMemoryState> = {}): DerivedMemoryState {
  return {
    id: "test-memory", content: "test content", mtype: "fact", importance: 0.5,
    speaker: "user", created_tick: 0, storage_score: 0.5, retrieval_score: 0.5,
    stability_score: 0.3, last_activated_tick: 0, last_reinforced_tick: 0,
    retrieval_count: 1, ageTicks: 100, inactiveTicks: 50, fadeRiskScore: 0.5,
    reinforcementLiftScore: 0.3, explanation: { summary: "test", bullets: [] },
    associations: [], ...overrides,
  }
}
