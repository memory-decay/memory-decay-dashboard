# Memory Decay Dashboard Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual "wow" moments to the memory-decay-dashboard: constellation hero, sparklines, decay curve chart, and score gauges — all via raw SVG + CSS with zero new dependencies.

**Architecture:** New pure-function utility (`lib/decay-curve.ts`) computes forward projections client-side using the `soft_floor_decay_step` formula. Four new SVG components consume this data. Existing components are modified to integrate them. `MetricRibbon` is removed; its data moves into the constellation sidebar.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4, raw SVG, CSS animations. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-03-24-dashboard-visual-redesign-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/decay-curve.ts` | Decay formula port + forward projection + SVG path generation |
| Create | `tests/decay-curve.test.ts` | Unit tests for decay math against known Python values |
| Create | `components/score-gauge.tsx` | Animated ring arc gauge for a single 0–1 score |
| Create | `components/sparkline.tsx` | Mini 64x28 SVG decay projection for memory rows |
| Create | `components/decay-curve-chart.tsx` | Full projected decay curve chart with grid, axes, dual lines |
| Create | `components/constellation.tsx` | Memory constellation hero — glowing nodes + association edges |
| Modify | `components/memory-list-panel.tsx` | Add sparkline to each memory row |
| Modify | `components/memory-detail-panel.tsx` | Replace score grid with gauges + add decay chart |
| Modify | `components/dashboard-shell.tsx` | Add constellation, remove MetricRibbon import, wire data |
| Modify | `app/globals.css` | Add grid-bg, gauge, chart CSS classes |
| Delete | `components/metric-ribbon.tsx` | Replaced by constellation sidebar stats |

---

## Chunk 1: Decay Curve Utility (TDD)

### Task 1: Write decay curve utility with tests

This is the mathematical foundation. Port `soft_floor_decay_step` from `decay.py` to TypeScript, then build `projectForward` on top of it.

**Files:**
- Create: `lib/decay-curve.ts`
- Create: `tests/decay-curve.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/decay-curve.test.ts`:

```typescript
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
  // raw_floor = 0.05 + (0.35 - 0.05) * 0.6^2 = 0.05 + 0.108 = 0.158
  const floor = computeFloor(0.6, 1.0, DEFAULT_DECAY_PARAMS)
  assert.ok(Math.abs(floor - 0.158) < 0.001, `expected ~0.158, got ${floor}`)
})

test("computeFloor clamps to activation", () => {
  // If activation is 0.05, floor must not exceed it
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
  // Run 500 ticks of decay on a low-importance memory
  let activation = 1.0
  const params = { ...DEFAULT_DECAY_PARAMS, lam: 0.035 }
  const floor = computeFloor(0.3, activation, DEFAULT_DECAY_PARAMS)
  for (let i = 0; i < 500; i++) {
    activation = softFloorDecayStep(activation, 0.3, 0.0, params)
  }
  // floor for impact=0.3: 0.05 + 0.30 * 0.3^2 = 0.05 + 0.027 = 0.077
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
  assert.equal(points.length, 51) // tick 0 (now) + 50 future ticks
})

test("projectForward first point matches current scores", () => {
  const memory = makeMockMemory({ storage_score: 0.42, retrieval_score: 0.65 })
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, 10)
  assert.ok(
    Math.abs(points[0].storage - 0.42) < 0.001,
    `expected storage ~0.42, got ${points[0].storage}`,
  )
  assert.ok(
    Math.abs(points[0].retrieval - 0.65) < 0.001,
    `expected retrieval ~0.65, got ${points[0].retrieval}`,
  )
})

test("projectForward scores decrease monotonically", () => {
  const memory = makeMockMemory({ storage_score: 0.8, retrieval_score: 0.9 })
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, 100)
  for (let i = 1; i < points.length; i++) {
    assert.ok(
      points[i].storage <= points[i - 1].storage + 1e-9,
      `storage increased at tick ${i}: ${points[i - 1].storage} -> ${points[i].storage}`,
    )
    assert.ok(
      points[i].retrieval <= points[i - 1].retrieval + 1e-9,
      `retrieval increased at tick ${i}: ${points[i - 1].retrieval} -> ${points[i].retrieval}`,
    )
  }
})

test("svgPathFromPoints generates valid d attribute", () => {
  const points = [
    { tick: 0, storage: 1.0, retrieval: 0.8 },
    { tick: 1, storage: 0.9, retrieval: 0.7 },
    { tick: 2, storage: 0.8, retrieval: 0.6 },
  ]
  const d = svgPathFromPoints(points, (p) => p.storage, {
    x: 50,
    y: 10,
    width: 560,
    height: 160,
    maxTick: 2,
  })
  assert.ok(d.startsWith("M"), `expected path to start with M, got: ${d}`)
  assert.ok(d.includes("L"), `expected path to include L commands`)
})

function makeMockMemory(overrides: Partial<DerivedMemoryState> = {}): DerivedMemoryState {
  return {
    id: "test-memory",
    content: "test content",
    mtype: "fact",
    importance: 0.5,
    speaker: "user",
    created_tick: 0,
    storage_score: 0.5,
    retrieval_score: 0.5,
    stability_score: 0.3,
    last_activated_tick: 0,
    last_reinforced_tick: 0,
    retrieval_count: 1,
    ageTicks: 100,
    inactiveTicks: 50,
    fadeRiskScore: 0.5,
    reinforcementLiftScore: 0.3,
    explanation: { summary: "test", bullets: [] },
    associations: [],
    ...overrides,
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsx --test tests/decay-curve.test.ts`

Expected: FAIL — module `@/lib/decay-curve` does not exist.

- [ ] **Step 3: Implement `lib/decay-curve.ts`**

Create `lib/decay-curve.ts`:

```typescript
import type { DerivedMemoryState } from "@/lib/types"

export type DecayParams = {
  lambdaFact: number
  lambdaEpisode: number
  alpha: number
  rho: number
  floorMin: number
  floorMax: number
  floorPower: number
  gateCentre: number
  gateWidth: number
  consolidationGain: number
  minRateScale: number
  stabilityDecay: number
}

export const DEFAULT_DECAY_PARAMS: DecayParams = {
  lambdaFact: 0.02,
  lambdaEpisode: 0.035,
  alpha: 2.0,
  rho: 0.8,
  floorMin: 0.05,
  floorMax: 0.35,
  floorPower: 2.0,
  gateCentre: 0.4,
  gateWidth: 0.08,
  consolidationGain: 0.6,
  minRateScale: 0.1,
  stabilityDecay: 0.01,
}

/** Numerically stable logistic gate — mirrors _sigmoid_gate in decay.py */
export function sigmoidGate(value: number, center: number, width: number): number {
  const scaled = (value - center) / Math.max(width, 1e-6)
  if (scaled >= 0) {
    const z = Math.exp(-scaled)
    return 1.0 / (1.0 + z)
  }
  const z = Math.exp(scaled)
  return z / (1.0 + z)
}

/** Impact-based floor, clamped to never exceed current activation. */
export function computeFloor(
  impact: number,
  activation: number,
  params: DecayParams,
): number {
  const rawFloor =
    params.floorMin +
    (params.floorMax - params.floorMin) * Math.pow(impact, params.floorPower)
  return Math.min(rawFloor, activation)
}

/**
 * One tick of soft-floor decay — mirrors soft_floor_decay_step in decay.py.
 * Guarantees: floor <= result <= activation.
 */
export function softFloorDecayStep(
  activation: number,
  impact: number,
  stability: number,
  params: DecayParams & { lam: number },
): number {
  activation = Math.min(Math.max(activation, 0.0), 1.0)
  if (activation <= 0.0) return 0.0

  impact = Math.min(Math.max(impact, 0.0), 1.0)
  stability = Math.max(stability, 0.0)

  const combined = Math.max(
    Math.exp(params.alpha * impact) * (1.0 + params.rho * stability),
    1e-9,
  )
  const floor = computeFloor(impact, activation, params)

  const gate = sigmoidGate(activation, params.gateCentre, params.gateWidth)
  let rateScale = 1.0 - params.consolidationGain * impact * gate
  rateScale = Math.min(Math.max(rateScale, params.minRateScale), 1.0)
  const effectiveRate = Math.max(params.lam * rateScale / combined, 0.0)

  const updated = floor + (activation - floor) * Math.exp(-effectiveRate)
  return Math.min(Math.max(updated, floor), activation)
}

export type ProjectedPoint = { tick: number; storage: number; retrieval: number }

/**
 * Project a memory's storage and retrieval scores forward for `steps` ticks.
 * Returns steps+1 points (tick 0 = current state).
 * Stability also decays each tick (matching DecayEngine behavior).
 */
export function projectForward(
  memory: DerivedMemoryState,
  params: DecayParams,
  steps: number,
): ProjectedPoint[] {
  const lam =
    memory.mtype === "fact" ? params.lambdaFact : params.lambdaEpisode
  const stepParams = { ...params, lam }

  let storage = memory.storage_score
  let retrieval = memory.retrieval_score
  let stability = memory.stability_score
  const impact = memory.importance

  const points: ProjectedPoint[] = [{ tick: 0, storage, retrieval }]

  for (let t = 1; t <= steps; t++) {
    storage = softFloorDecayStep(storage, impact, stability, stepParams)
    retrieval = softFloorDecayStep(retrieval, impact, stability, stepParams)
    stability = Math.min(stability * (1.0 - params.stabilityDecay), 1.0)
    points.push({ tick: t, storage, retrieval })
  }

  return points
}

export type ChartDimensions = {
  x: number
  y: number
  width: number
  height: number
  maxTick: number
}

/** Convert projected points to an SVG path `d` string. */
export function svgPathFromPoints(
  points: ProjectedPoint[],
  accessor: (p: ProjectedPoint) => number,
  dim: ChartDimensions,
): string {
  if (points.length === 0) return ""

  const parts: string[] = []
  for (let i = 0; i < points.length; i++) {
    const px = dim.x + (points[i].tick / Math.max(dim.maxTick, 1)) * dim.width
    const py = dim.y + (1 - accessor(points[i])) * dim.height
    parts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return parts.join(" ")
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsx --test tests/decay-curve.test.ts`

Expected: All 11 tests PASS.

- [ ] **Step 5: Also run existing tests to check nothing broke**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsx --test tests/**/*.test.ts`

Expected: All tests PASS (including existing `ui-labels.test.ts`).

- [ ] **Step 6: Commit**

```bash
cd /home/roach/.openclaw/workspace/memory-decay-dashboard
git add lib/decay-curve.ts tests/decay-curve.test.ts
git commit -m "Add decay curve utility with soft_floor_decay_step port

Ports the soft_floor_decay_step formula from decay.py to TypeScript
for client-side forward projection of memory decay curves.
Includes sigmoidGate, computeFloor, projectForward, and SVG path
generation. All parameters match decay.py defaults.

Constraint: Uses simplified approximation — databases with custom_decay_fn will differ
Tested: 11 unit tests covering sigmoid gate, floor clamping, monotonic decay, edge cases
Confidence: high
Scope-risk: narrow
"
```

---

## Chunk 2: Score Gauge + Sparkline Components

### Task 2: Create ScoreGauge component

**Files:**
- Create: `components/score-gauge.tsx`

- [ ] **Step 1: Create `components/score-gauge.tsx`**

```tsx
type ScoreGaugeProps = {
  value: number
  label: string
  color: string
  glowColor: string
}

const RADIUS = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreGauge({ value, label, color, glowColor }: ScoreGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), 1)
  const dashArray = clamped * CIRCUMFERENCE
  const dashGap = CIRCUMFERENCE - dashArray

  return (
    <div className="gauge-card">
      <p className="label">{label}</p>
      <div className="relative mx-auto mt-2 h-[72px] w-[72px]">
        <svg viewBox="0 0 72 72" className="h-full w-full">
          <circle
            cx={36}
            cy={36}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-border"
          />
          <circle
            cx={36}
            cy={36}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={`${dashArray.toFixed(1)} ${dashGap.toFixed(1)}`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            className="gauge-ring-arc"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold"
          style={{ color }}
        >
          {clamped.toFixed(2)}
        </span>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/score-gauge.tsx
git commit -m "Add ScoreGauge component with animated SVG ring arc

Renders a 0-1 score as a circular gauge with glow effect.
Uses stroke-dasharray for the arc and CSS drop-shadow for glow.
"
```

### Task 3: Create Sparkline component

**Files:**
- Create: `components/sparkline.tsx`

- [ ] **Step 1: Create `components/sparkline.tsx`**

```tsx
import { projectForward, svgPathFromPoints, DEFAULT_DECAY_PARAMS } from "@/lib/decay-curve"
import type { DerivedMemoryState } from "@/lib/types"

type SparklineProps = {
  memory: DerivedMemoryState
}

const STEPS = 30
const DIM = { x: 0, y: 0, width: 64, height: 28, maxTick: STEPS }

function scoreColor(score: number): string {
  if (score > 0.6) return "rgba(52,211,153,"  // stable green
  if (score > 0.3) return "rgba(245,166,91,"  // amber
  return "rgba(248,113,113,"                   // danger red
}

export function Sparkline({ memory }: SparklineProps) {
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, STEPS)
  const linePath = svgPathFromPoints(points, (p) => p.storage, DIM)
  const colorBase = scoreColor(memory.storage_score)

  // Area fill: line path + close to bottom-right then bottom-left
  const lastX = (points[points.length - 1].tick / STEPS) * 64
  const areaPath = `${linePath} L${lastX.toFixed(1)},28 L0,28 Z`

  return (
    <div className="h-[28px] w-[64px] flex-shrink-0 opacity-0 sparkline-fade-in">
      <svg viewBox="0 0 64 28" className="h-full w-full">
        <defs>
          <linearGradient id={`spark-${memory.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${colorBase}0.15)`} />
            <stop offset="100%" stopColor={`${colorBase}0)`} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#spark-${memory.id})`} />
        <path d={linePath} fill="none" stroke={`${colorBase}0.6)`} strokeWidth={1.5} />
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/sparkline.tsx
git commit -m "Add Sparkline component for inline decay projection

64x28 SVG mini-chart showing forward-projected storage decay curve.
Color tier: green > 0.6, amber 0.3-0.6, red < 0.3.
"
```

---

## Chunk 3: Decay Curve Chart Component

### Task 4: Create DecayCurveChart component

The full projected decay curve visualization — the main "wow" moment.

**Files:**
- Create: `components/decay-curve-chart.tsx`

- [ ] **Step 1: Create `components/decay-curve-chart.tsx`**

```tsx
import {
  projectForward,
  svgPathFromPoints,
  computeFloor,
  DEFAULT_DECAY_PARAMS,
} from "@/lib/decay-curve"
import type { DerivedMemoryState } from "@/lib/types"

type DecayCurveChartProps = {
  memory: DerivedMemoryState
}

const STEPS = 100
const CHART = { x: 50, y: 10, width: 560, height: 160, maxTick: STEPS }
const SVG_W = 640
const SVG_H = 200

function yPos(score: number): number {
  return CHART.y + (1 - score) * CHART.height
}

function xPos(tick: number): number {
  return CHART.x + (tick / STEPS) * CHART.width
}

export function DecayCurveChart({ memory }: DecayCurveChartProps) {
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, STEPS)
  const storagePath = svgPathFromPoints(points, (p) => p.storage, CHART)
  const retrievalPath = svgPathFromPoints(points, (p) => p.retrieval, CHART)
  const floor = computeFloor(memory.importance, memory.storage_score, DEFAULT_DECAY_PARAMS)

  // Area fill for storage
  const lastX = xPos(STEPS)
  const bottomY = CHART.y + CHART.height
  const storageAreaPath = `${storagePath} L${lastX.toFixed(1)},${bottomY} L${CHART.x},${bottomY} Z`

  const yLabels = [
    { value: 1.0, label: "1.0" },
    { value: 0.75, label: "0.75" },
    { value: 0.5, label: "0.50" },
    { value: 0.25, label: "0.25" },
    { value: 0.0, label: "0.0" },
  ]

  const xLabels = [0, 25, 50, 75, 100]

  return (
    <div className="chart-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Approximate projection</p>
          <h3 className="mt-1 text-[15px] font-semibold text-text-primary">
            Projected decay from current state
          </h3>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="inline-block h-[2px] w-4 rounded-full bg-status-danger" />
            Storage
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="inline-block h-[2px] w-4 rounded-full bg-status-stable" />
            Retrieval
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span
              className="inline-block h-[1px] w-4"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #f5a65b 0px, #f5a65b 4px, transparent 4px, transparent 8px)",
              }}
            />
            Floor
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mt-3 w-full">
        <defs>
          <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
          <filter id="glow-now" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Axes */}
        <line
          x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={bottomY}
          stroke="rgba(124,156,255,0.08)" strokeWidth={0.5}
        />
        <line
          x1={CHART.x} y1={bottomY} x2={lastX} y2={bottomY}
          stroke="rgba(124,156,255,0.08)" strokeWidth={0.5}
        />

        {/* Y gridlines + labels */}
        {yLabels.map(({ value, label }) => (
          <g key={`y-${label}`}>
            {value > 0 && value < 1 && (
              <line
                x1={CHART.x} y1={yPos(value)} x2={lastX} y2={yPos(value)}
                stroke="rgba(124,156,255,0.04)" strokeWidth={0.5} strokeDasharray="4,4"
              />
            )}
            <text
              x={CHART.x - 6} y={yPos(value) + 3}
              fill="#70809c" fontSize={9} textAnchor="end" fontFamily="DM Mono, monospace"
            >
              {label}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((tick) => (
          <text
            key={`x-${tick}`}
            x={xPos(tick)} y={bottomY + 14}
            fill="#70809c" fontSize={8} textAnchor="middle" fontFamily="DM Mono, monospace"
          >
            +{tick}
          </text>
        ))}
        <text
          x={xPos(50)} y={bottomY + 26}
          fill="#505a70" fontSize={8} textAnchor="middle" fontFamily="DM Sans, sans-serif"
        >
          ticks from now
        </text>

        {/* Impact floor */}
        <line
          x1={CHART.x} y1={yPos(floor)} x2={lastX} y2={yPos(floor)}
          stroke="#f5a65b" strokeWidth={1} strokeDasharray="6,4" opacity={0.4}
        />

        {/* NOW marker */}
        <line
          x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={bottomY}
          stroke="rgba(124,156,255,0.2)" strokeWidth={1} strokeDasharray="3,3"
        />
        <text
          x={CHART.x} y={CHART.y - 3}
          fill="#7c9cff" fontSize={8} textAnchor="middle" fontFamily="DM Mono, monospace"
        >
          NOW
        </text>

        {/* Storage curve + area */}
        <path d={storageAreaPath} fill="url(#storageFill)" opacity={0.1} />
        <path
          d={storagePath} fill="none" stroke="#f87171" strokeWidth={1.8}
          strokeDasharray="6,4" opacity={0.7}
        />

        {/* Retrieval curve */}
        <path
          d={retrievalPath} fill="none" stroke="#34d399" strokeWidth={1.8}
          strokeDasharray="6,4" opacity={0.5}
        />

        {/* Current position dots */}
        <circle
          cx={CHART.x} cy={yPos(memory.storage_score)} r={4}
          fill="#f87171" filter="url(#glow-now)"
        />
        <circle
          cx={CHART.x} cy={yPos(memory.retrieval_score)} r={3.5}
          fill="#34d399" filter="url(#glow-now)"
        />
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/decay-curve-chart.tsx
git commit -m "Add DecayCurveChart component with forward projection

Full SVG chart showing projected storage + retrieval decay curves,
impact floor, NOW marker, grid background, and glow dots.
Labels curves as 'approximate projection' per spec.
"
```

---

## Chunk 4: Constellation Component

### Task 5: Create Constellation hero component

**Files:**
- Create: `components/constellation.tsx`

- [ ] **Step 1: Create `components/constellation.tsx`**

The constellation maps all memories as glowing SVG nodes with association edges. Nodes are positioned using a deterministic spiral layout sorted by storage_score (strong at center, fading at edges).

```tsx
"use client"

import { useMemo } from "react"
import type { DerivedMemoryState } from "@/lib/types"

type ConstellationProps = {
  memories: Record<string, DerivedMemoryState>
  selectedId: string | null
  onSelect: (id: string) => void
  currentTick: number
  memoryCount: number
  associationCount: number
  spotlightLabel?: string
  spotlightId?: string
}

type Edge = { from: string; to: string; weight: number }

function extractEdges(memories: Record<string, DerivedMemoryState>): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []
  for (const mem of Object.values(memories)) {
    for (const assoc of mem.associations) {
      const key = [mem.id, assoc.targetId].sort().join("||")
      if (!seen.has(key) && memories[assoc.targetId]) {
        seen.add(key)
        edges.push({ from: mem.id, to: assoc.targetId, weight: assoc.weight })
      }
    }
  }
  return edges
}

function nodeColor(score: number): string {
  if (score > 0.6) return "52,211,153"   // green
  if (score > 0.3) return "245,166,91"   // amber
  if (score > 0.1) return "248,113,113"  // red
  return "112,128,156"                    // ghost
}

function glowFilter(score: number): string {
  if (score > 0.6) return "url(#glow-strong)"
  if (score > 0.3) return "url(#glow-mid)"
  if (score > 0.1) return "url(#glow-dim)"
  return ""
}

/** Deterministic spiral layout — strong memories near center, fading at edges. */
function spiralLayout(
  memories: DerivedMemoryState[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(width, height) * 0.42
  const sorted = [...memories].sort((a, b) => b.storage_score - a.storage_score)
  const positions = new Map<string, { x: number; y: number }>()

  if (sorted.length === 0) return positions

  // First node at center
  positions.set(sorted[0].id, { x: cx, y: cy })

  // Golden angle spiral for remaining
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 1; i < sorted.length; i++) {
    const frac = i / sorted.length
    const r = maxR * Math.sqrt(frac)
    const theta = i * goldenAngle
    positions.set(sorted[i].id, {
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    })
  }

  return positions
}

const SVG_W = 800
const SVG_H = 220

export function Constellation({
  memories,
  selectedId,
  onSelect,
  currentTick,
  memoryCount,
  associationCount,
  spotlightLabel,
  spotlightId,
}: ConstellationProps) {
  const memoryList = useMemo(() => Object.values(memories), [memories])
  const edges = useMemo(() => extractEdges(memories), [memories])
  const positions = useMemo(
    () => spiralLayout(memoryList, SVG_W, SVG_H),
    [memoryList],
  )

  return (
    <section className="constellation-section panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Memory constellation</p>
          {spotlightLabel ? (
            <button
              type="button"
              className="mt-1 text-left text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
              onClick={() => spotlightId && onSelect(spotlightId)}
            >
              Spotlight: {spotlightLabel}
            </button>
          ) : null}
        </div>
        <div className="flex gap-4">
          {[
            { color: "#34d399", label: "Strong" },
            { color: "#f5a65b", label: "Weakening" },
            { color: "#f87171", label: "Fading" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-5">
        <div className="flex-1 min-h-[220px]">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full">
            <defs>
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-mid" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-dim" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Association edges */}
            {edges.map((edge) => {
              const from = positions.get(edge.from)
              const to = positions.get(edge.to)
              if (!from || !to) return null
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={`rgba(124,156,255,${(edge.weight * 0.2).toFixed(2)})`}
                  strokeWidth={edge.weight > 0.5 ? 1 : 0.5}
                />
              )
            })}

            {/* Memory nodes */}
            {memoryList.map((mem) => {
              const pos = positions.get(mem.id)
              if (!pos) return null
              const r = 8 + mem.importance * 18
              const rgb = nodeColor(mem.storage_score)
              const opacity = Math.max(mem.storage_score, 0.05)
              const isSelected = selectedId === mem.id
              const filter = glowFilter(mem.storage_score)
              const pulseClass = mem.storage_score > 0.8 ? "constellation-glow-pulse" : ""

              return (
                <g
                  key={mem.id}
                  role="img"
                  aria-label={`Memory ${mem.id}: storage ${mem.storage_score.toFixed(2)}, retrieval ${mem.retrieval_score.toFixed(2)}`}
                  className={`cursor-pointer ${pulseClass}`}
                  onClick={() => onSelect(mem.id)}
                >
                  <circle
                    cx={pos.x} cy={pos.y} r={r}
                    fill={`rgba(${rgb},${(opacity * 0.15).toFixed(2)})`}
                    stroke={`rgba(${rgb},${(opacity * 0.6).toFixed(2)})`}
                    strokeWidth={isSelected ? 2 : 1}
                    filter={filter}
                  />
                  {isSelected && (
                    <circle
                      cx={pos.x} cy={pos.y} r={r + 4}
                      fill="none"
                      stroke="rgba(124,156,255,0.4)"
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                    />
                  )}
                  {r >= 12 && (
                    <text
                      x={pos.x} y={pos.y + 3}
                      fill={`rgba(${rgb},${Math.max(opacity, 0.3).toFixed(2)})`}
                      fontSize={r >= 18 ? 9 : 7}
                      textAnchor="middle"
                      fontFamily="DM Mono, monospace"
                      fontWeight={500}
                    >
                      {mem.storage_score.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Sidebar stats */}
        <div className="flex w-[180px] flex-shrink-0 flex-col gap-3">
          <div className="stat-card">
            <p className="label">Current Tick</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent font-mono">{currentTick}</p>
          </div>
          <div className="stat-card">
            <p className="label">Memories</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent-secondary font-mono">{memoryCount}</p>
          </div>
          <div className="stat-card">
            <p className="label">Associations</p>
            <p className="mt-1.5 text-2xl font-semibold text-accent-warm font-mono">{associationCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/constellation.tsx
git commit -m "Add Constellation hero component with glowing nodes

Memories rendered as SVG nodes sized by importance, colored by
storage_score tier. Golden-angle spiral layout places strong memories
at center. Association edges drawn between connected nodes.
Includes stat sidebar replacing MetricRibbon.
"
```

---

## Chunk 5: Integration — Modify Existing Components

### Task 6: Add CSS classes for new components

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add new CSS classes to globals.css**

Append inside the `@layer components` block (before the closing `}`):

```css
  .constellation-section {
    @apply relative overflow-hidden p-5;
    background-image:
      linear-gradient(rgba(124, 156, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124, 156, 255, 0.03) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .stat-card {
    @apply rounded-xl border border-border bg-bg-primary/60 p-3.5;
  }

  .gauge-card {
    @apply relative overflow-hidden rounded-2xl border border-border bg-bg-primary/50 p-4 text-center;
  }

  .gauge-ring-arc {
    transition: stroke-dasharray 600ms ease-out;
  }

  .chart-section {
    @apply relative overflow-hidden rounded-2xl border border-border bg-bg-primary/50 p-5;
    background-image:
      linear-gradient(rgba(124, 156, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124, 156, 255, 0.025) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .sparkline-fade-in {
    animation: sparkline-in 200ms ease-out forwards;
  }

  @keyframes sparkline-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  .constellation-glow-pulse {
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .gauge-ring-arc {
      transition: none;
    }
    .sparkline-fade-in {
      animation: none;
      opacity: 1;
    }
    .constellation-glow-pulse {
      animation: none;
      opacity: 0.8;
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "Add CSS classes for constellation, gauge, chart, sparkline

Grid backgrounds, gauge ring transition, sparkline fade-in animation.
All animations respect prefers-reduced-motion.
"
```

### Task 7: Add sparklines to MemoryListPanel

**Files:**
- Modify: `components/memory-list-panel.tsx`

- [ ] **Step 1: Modify `components/memory-list-panel.tsx`**

Add import at top:

```typescript
import { Sparkline } from "@/components/sparkline"
```

Replace the inner content of each memory row button. Change the existing layout from:

```tsx
<div className="flex items-start justify-between gap-4">
  <div>
    <p className="font-medium text-text-primary">{memory.id}</p>
    <p className="mt-1 text-sm text-text-secondary">{memory.content.slice(0, 110)}</p>
  </div>
  <div className="text-right">
    <p className={`text-xs uppercase tracking-[0.22em] ${scoreToneClassName}`}>{scoreLabel}</p>
    <p className={`mt-1 text-2xl font-semibold ${scoreToneClassName}`}>
      {formatScore(score(memory))}
    </p>
  </div>
</div>
```

To:

```tsx
<div className="flex items-center gap-3">
  <div className="min-w-0 flex-1">
    <p className="truncate font-medium text-text-primary">{memory.id}</p>
    <p className="mt-1 truncate text-sm text-text-secondary">{memory.content.slice(0, 110)}</p>
  </div>
  <Sparkline memory={memory} />
  <div className="w-12 flex-shrink-0 text-right">
    <p className={`text-[8px] uppercase tracking-[0.15em] ${scoreToneClassName}`}>{scoreLabel}</p>
    <p className={`mt-0.5 font-mono text-lg font-semibold ${scoreToneClassName}`}>
      {formatScore(score(memory))}
    </p>
  </div>
</div>
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/memory-list-panel.tsx
git commit -m "Add inline sparklines to memory list rows

Each memory row now shows a 64x28 projected decay sparkline
between the info text and the score value.
"
```

### Task 8: Redesign MemoryDetailPanel with gauges + chart

**Files:**
- Modify: `components/memory-detail-panel.tsx`

- [ ] **Step 1: Modify `components/memory-detail-panel.tsx`**

Replace the entire file content:

```tsx
import { AssociationContext } from "@/components/association-context"
import { DecayCurveChart } from "@/components/decay-curve-chart"
import { ScoreGauge } from "@/components/score-gauge"
import { DECAY_SCORE_LABEL, RECALL_SCORE_LABEL } from "@/lib/ui-labels"
import type { DerivedMemoryState } from "@/lib/types"

export function MemoryDetailPanel({ memory }: { memory: DerivedMemoryState | null }) {
  return (
    <section className="panel min-h-[32rem] p-6">
      {!memory ? (
        <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-border bg-bg-primary/35 p-8 text-center text-text-secondary">
          Load a database and select a memory to inspect its current decay and reinforcement state.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label">Memory detail</p>
              <h2 className="mt-2 text-2xl font-semibold">{memory.id}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{memory.content}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="metric-chip">{memory.mtype}</span>
              <span className="metric-chip">speaker {memory.speaker || "unknown"}</span>
              <span className="metric-chip">importance {memory.importance.toFixed(2)}</span>
            </div>
          </div>

          {/* Score Gauges */}
          <div className="grid grid-cols-3 gap-3">
            <ScoreGauge
              value={memory.storage_score}
              label={DECAY_SCORE_LABEL}
              color="#f87171"
              glowColor="rgba(248,113,113,0.4)"
            />
            <ScoreGauge
              value={memory.retrieval_score}
              label={RECALL_SCORE_LABEL}
              color="#34d399"
              glowColor="rgba(52,211,153,0.4)"
            />
            <ScoreGauge
              value={memory.stability_score}
              label="Stability"
              color="#7c9cff"
              glowColor="rgba(124,156,255,0.4)"
            />
          </div>

          {/* Tick info (compact) */}
          <p className="text-xs text-text-muted">
            Inactive {memory.inactiveTicks} ticks &middot; Age {memory.ageTicks} ticks
          </p>

          {/* Decay Curve Chart */}
          <DecayCurveChart memory={memory} />

          {/* Interpretation */}
          <article className="rounded-2xl border border-border bg-bg-primary/45 p-5">
            <p className="label">Current-state interpretation</p>
            <p className="mt-3 text-base font-medium leading-7 text-text-primary">
              {memory.explanation.summary}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-text-secondary">
              {memory.explanation.bullets.map((bullet) => (
                <li key={bullet}>
                  <span className="mr-2 text-text-muted">&#8226;</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </article>

          {/* Stored fields */}
          <article className="rounded-2xl border border-border bg-bg-primary/45 p-5">
            <p className="label">Stored fields</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm lg:grid-cols-3">
              <DetailField label="Created tick" value={memory.created_tick} />
              <DetailField label="Last activated" value={memory.last_activated_tick} />
              <DetailField label="Last reinforced" value={memory.last_reinforced_tick} />
              <DetailField label="Storage" value={memory.storage_score.toFixed(2)} />
              <DetailField label="Retrieval" value={memory.retrieval_score.toFixed(2)} />
              <DetailField label="Stability" value={memory.stability_score.toFixed(2)} />
              <DetailField label="Retrieval count" value={memory.retrieval_count} />
              <DetailField label="Associations" value={memory.associations.length} />
            </dl>
          </article>

          {/* Associations */}
          <article className="rounded-2xl border border-border bg-bg-primary/45 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">Association context</p>
                <h3 className="mt-2 text-lg font-semibold">Connected memories</h3>
              </div>
              <div className="metric-chip">{memory.associations.length} links</div>
            </div>
            <div className="mt-4">
              <AssociationContext associations={memory.associations} />
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

function DetailField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface/80 p-2.5">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text-primary">{value}</dd>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/memory-detail-panel.tsx
git commit -m "Redesign detail panel with score gauges and decay chart

Replaces 4-column score grid with 3 animated ring gauges.
Adds DecayCurveChart for forward-projected decay visualization.
Inactive/age ticks shown as compact text below gauges.
"
```

### Task 9: Update DashboardShell — add Constellation, remove MetricRibbon

**Files:**
- Modify: `components/dashboard-shell.tsx`
- Delete: `components/metric-ribbon.tsx`

- [ ] **Step 1: Modify `components/dashboard-shell.tsx`**

Replace the entire file content:

```tsx
"use client"

import { useMemo, useState } from "react"
import { Constellation } from "@/components/constellation"
import { DbPicker } from "@/components/db-picker"
import { FadingMemoriesPanel } from "@/components/fading-memories-panel"
import { MemoryDetailPanel } from "@/components/memory-detail-panel"
import { ReinforcedMemoriesPanel } from "@/components/reinforced-memories-panel"
import type { DerivedMemoryState } from "@/lib/types"

type SummaryPayload = {
  path: string
  meta: {
    currentTick: number
    memoryCount: number
    associationCount: number
  }
  fastestFading: DerivedMemoryState[]
  reinforcedSurvivors: DerivedMemoryState[]
  spotlight: DerivedMemoryState | null
  byId: Record<string, DerivedMemoryState>
}

const RECENT_PATHS_KEY = "memory-decay-dashboard:recent-paths"

function readRecentPaths() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENT_PATHS_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecentPaths(paths: string[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(paths.slice(0, 6)))
}

export function DashboardShell() {
  const [path, setPath] = useState("memory-decay/data/memories.db")
  const [data, setData] = useState<SummaryPayload | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentPaths, setRecentPaths] = useState<string[]>(() => readRecentPaths())

  const selectedMemory = useMemo(() => {
    if (!data) return null
    const id = selectedId ?? data.spotlight?.id ?? data.fastestFading[0]?.id ?? null
    return id ? data.byId[id] ?? null : null
  }, [data, selectedId])

  async function loadSummary() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/db/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load database")
      }

      setData(payload)
      setSelectedId(payload.spotlight?.id ?? payload.fastestFading[0]?.id ?? null)

      const nextRecent = [path, ...recentPaths.filter((item) => item !== path)]
      setRecentPaths(nextRecent)
      writeRecentPaths(nextRecent)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database")
      setData(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-6 px-5 py-8 lg:px-8">
      {/* Header */}
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="label">memory-decay-dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            Memory Decay Observatory
          </h1>
        </div>
        {data ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-primary/70 px-3.5 py-1.5 font-mono text-xs text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-status-stable" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.5)" }} />
            {data.path.split("/").pop()}
          </div>
        ) : null}
      </section>

      <DbPicker value={path} onChange={setPath} onLoad={loadSummary} loading={loading} recentPaths={recentPaths} />

      {error ? (
        <section className="rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {/* Constellation Hero */}
      {data ? (
        <Constellation
          memories={data.byId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          currentTick={data.meta.currentTick}
          memoryCount={data.meta.memoryCount}
          associationCount={data.meta.associationCount}
          spotlightLabel={data.spotlight ? `${data.spotlight.id} — ${data.spotlight.explanation.summary}` : undefined}
          spotlightId={data.spotlight?.id}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_1.25fr]">
        <FadingMemoriesPanel
          memories={data?.fastestFading ?? []}
          selectedId={selectedId ?? undefined}
          onSelect={setSelectedId}
        />
        <ReinforcedMemoriesPanel
          memories={data?.reinforcedSurvivors ?? []}
          selectedId={selectedId ?? undefined}
          onSelect={setSelectedId}
        />
        <MemoryDetailPanel memory={selectedMemory} />
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Delete `components/metric-ribbon.tsx`**

```bash
cd /home/roach/.openclaw/workspace/memory-decay-dashboard
git rm components/metric-ribbon.tsx
```

- [ ] **Step 3: Verify typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors. The `MetricRibbon` import is gone and no other file imports it.

- [ ] **Step 4: Run all tests**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsx --test tests/**/*.test.ts`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard-shell.tsx
git commit -m "Wire Constellation into DashboardShell, remove MetricRibbon

Replaces text-heavy header with compact title + db chip.
Adds Constellation hero between header and main grid.
MetricRibbon stats now live in constellation sidebar.
Spotlight label shown as clickable subtitle in constellation header.

Rejected: keeping MetricRibbon alongside constellation | redundant stat display
"
```

---

## Chunk 6: Build Verification

### Task 10: Full build and visual verification

- [ ] **Step 1: Run production build**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npm run build`

Expected: Build succeeds with no errors. Check for any warnings about missing imports or unused variables.

- [ ] **Step 2: Run all tests**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsx --test tests/**/*.test.ts`

Expected: All tests PASS.

- [ ] **Step 3: Run typecheck**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Start dev server and verify visually**

Run: `cd /home/roach/.openclaw/workspace/memory-decay-dashboard && npm run dev`

Open `http://localhost:3000`. Load a database and verify:
1. Constellation renders with glowing nodes
2. Clicking a node selects it in the detail panel
3. Sparklines appear in both fading and reinforced memory rows
4. Score gauges show ring arcs for storage/retrieval/stability
5. Decay curve chart shows projected curves with floor line
6. Inactive/age ticks appear as text below gauges
7. Stats sidebar shows tick count, memory count, association count

- [ ] **Step 5: If any fixes were needed, commit them**

Only commit if changes were made in step 4. Stage specific files only:

```bash
git add components/ lib/ app/globals.css
git commit -m "Fix issues found during visual verification"
```
