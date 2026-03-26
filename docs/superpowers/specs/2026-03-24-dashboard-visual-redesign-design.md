# Memory Decay Dashboard — Visual Redesign

## Summary

Redesign the memory-decay-dashboard to create visual "wow" moments through three additions: a memory constellation hero visualization, inline sparklines in memory rows, and a projected decay curve chart in the detail panel. Zero new dependencies — all rendering via raw SVG + CSS animations.

## Context

The current dashboard is functional but visually flat: card-based layout with numeric scores and text explanations. There are no charts, graphs, or visual indicators of decay trajectories. The user wants to see *how* memories fade — not just their current scores.

The dashboard reads current-state data from memory-decay-core SQLite databases. It does not have historical snapshots. The decay formula (`soft_floor_decay_step`) is deterministic, so given current scores and parameters, we can project forward trajectories. We intentionally do **not** reconstruct past trajectories — the dashboard's philosophy is to explain current state, not pretend to know history (reinforcement events happened at unknown points, making backward reconstruction inaccurate).

## Design Decisions

### Approach: Scientific Observatory + Constellation Hero

**Chosen:** Combine data-dense decay curves (Scientific Observatory) with a glowing node visualization (Living Organism constellation) as the hero section.

**Rejected:** Cinematic Timeline — the dashboard explicitly avoids reconstructing historical events. The code comments state: "explains forgetting from current-state signals rather than pretending to reconstruct full history." A timeline of discrete events would require fabricating data.

**Rejected:** Charting library (Recharts, Chart.js) — the decay formula is simple enough to compute client-side. Raw SVG gives full control over glow filters, sparklines, and the constellation, which no charting library handles well. Zero bundle size increase.

### Rendering: Raw SVG + CSS

No new npm dependencies. The dashboard uses a **simplified approximation** of the decay curve for visualization purposes. The actual decay engine (`soft_floor_decay_step` in `decay.py`) includes a sigmoid consolidation gate and additional parameters, and databases may use custom decay functions. The dashboard labels projected curves as "approximate projection" to be honest about this.

**Simplified formula used for visualization:**

```
a(t+1) = floor(impact) + (a(t) - floor(impact)) * exp(-effective_rate)
```

Where:
- `floor(impact) = min(floor_min + (floor_max - floor_min) * impact^floor_power, a(t))`
- `combined = exp(alpha * impact) * (1 + rho * stability)`
- `gate = sigmoid((a(t) - gate_center) / gate_width)`
- `rate_scale = clamp(1.0 - consolidation_gain * impact * gate, min_rate_scale, 1.0)`
- `effective_rate = lambda * rate_scale / combined`

**Parameters (matching `soft_floor_decay_step` defaults in `decay.py`):**
- `lambda_fact=0.02`, `lambda_episode=0.035`
- `alpha=2.0`, `rho=0.8`
- `floor_min=0.05`, `floor_max=0.35`, `floor_power=2.0`
- `gate_center=0.4`, `gate_width=0.08`, `consolidation_gain=0.6`, `min_rate_scale=0.1`

**Limitation:** Databases using `custom_decay_fn` will have different actual trajectories. The dashboard's curves are best-effort projections based on the default formula.

## Architecture

### New Components

#### 1. `components/constellation.tsx`
Memory constellation — the hero visualization replacing the text-heavy header area.

**Data flow:** Receives all memories from `SummaryPayload.byId`. Association edges are reconstructed from the per-memory `associations[]` arrays in each `DerivedMemoryState` — no API changes needed. Edge list is deduplicated by sorting source/target pairs.

**Visual mapping:**
- Node radius: `8 + importance * 18` (range 8–26px)
- Node opacity/color: storage_score mapped to color gradient (green > 0.6, amber 0.3–0.6, red < 0.3, ghost < 0.1)
- Glow intensity: SVG `feGaussianBlur` filter, stdDeviation proportional to storage_score
- Association edges: lines between connected memories, opacity = association weight

**Layout:** Force-directed positioning is overkill for ≤50 nodes. Use a deterministic spiral/grid layout seeded by `created_tick` to keep positions stable across reloads. Memories sorted by storage_score radiate outward — strong at center, fading at edges.

**Interaction:** Click a node to select it (sets `selectedId` in DashboardShell). Hover shows tooltip with id + scores.

**Accessibility:** Each node is a `<g role="img" aria-label="...">` with descriptive text. `prefers-reduced-motion` disables glow pulse animation.

#### 2. `components/decay-curve-chart.tsx`
Projected decay curve for a selected memory — the primary "wow" visualization.

**Data flow:** Receives a single `DerivedMemoryState` + decay parameters.

**What it renders:**
- **Forward projection only** (dashed line from "NOW"): Apply decay formula forward from current scores for ~100 ticks. We intentionally do not reconstruct past trajectories — reinforcement events happened at unknown points, so backward reconstruction would be misleading. This aligns with the dashboard's philosophy of honest current-state analysis.
- **Current position** (solid dot at "NOW"): The memory's actual current storage and retrieval scores.
- **Impact floor** (dashed horizontal line): The asymptotic floor based on importance.
- **"NOW" marker**: Vertical dashed line at the start of the chart (tick 0 = now).
- **Dual curves**: Storage (red) and Retrieval (green) as separate projected lines.
- **Label**: Chart header reads "Approximate projection" to communicate that curves use default parameters and may differ from actual decay if the database uses custom functions.

X-axis represents "ticks from now" (0 to ~100), not "ticks since creation."

**Chart structure (all SVG):**
- Grid background via `<line>` elements with low opacity
- Y-axis: 0.0–1.0, X-axis: ticks from now (0 to ~100)
- Area fill below curves with gradient opacity
- Glow filter on the "now" position dots
- Responsive: SVG viewBox scales naturally

**Curve generation utility:** `lib/decay-curve.ts`
- `projectDecayCurve(memory, params, futureSteps)` → `{tick, storage, retrieval}[]`
- Computes forward projection using the simplified `soft_floor_decay_step` formula
- `svgPathFromPoints(points, yAccessor, chartDimensions)` → SVG path `d` string

#### 3. `components/sparkline.tsx`
Mini decay curve shown inline in memory list rows.

**Data flow:** Receives a single `DerivedMemoryState`.

**Rendering:** Simplified version of the decay curve — just 64x28 SVG with the storage_score trajectory as a single line + area fill. Color matches the score tier (red/amber/green). No axes, no labels.

**Purpose:** Makes decay trends scannable at a glance without clicking into the detail panel.

#### 4. `components/score-gauge.tsx`
Animated ring arc gauge for a single score value.

**Data flow:** `{ value: number; label: string; color: string }`

**Rendering:** SVG circle with `stroke-dasharray` proportional to value. Glow via `drop-shadow` CSS filter. Bottom accent bar via `::after` pseudo-element.

### Modified Components

#### `components/dashboard-shell.tsx`
- Add constellation section between header and main grid
- Pass `byId` to constellation (edges reconstructed from per-memory associations)
- Pass decay parameters to detail panel for curve generation

#### `components/memory-list-panel.tsx`
- Add `<Sparkline>` component to each memory row between info and score
- Adjust layout to accommodate sparkline (flex with fixed-width sparkline container)

#### `components/memory-detail-panel.tsx`
- Replace the 4-column score grid with 3 `<ScoreGauge>` ring components (storage, retrieval, stability)
- Display `inactiveTicks` and `ageTicks` as secondary text below the gauges row (e.g., "Inactive 45 ticks / Age 120 ticks") — these values are retained, just moved from the prominent grid to a compact line
- Add `<DecayCurveChart>` below gauges
- Keep interpretation and association sections

#### `components/metric-ribbon.tsx`
- Remove. The three stat values (current tick, memory count, association count) move into the constellation section's sidebar as `stat-card` components. The "Suggested next inspection" spotlight moves into the constellation header area as a compact subtitle below the "Memory constellation" label — shows `spotlight.id` + summary, clickable to select that memory.

### New Utility

#### `lib/decay-curve.ts`
Pure functions for decay curve computation. Mirrors the formula from `memory-decay-core/src/memory_decay/decay.py`:

```typescript
type DecayParams = {
  lambdaFact: number       // 0.02
  lambdaEpisode: number    // 0.035
  alpha: number            // 2.0 (matches soft_floor_decay_step default)
  rho: number              // 0.8
  floorMin: number         // 0.05
  floorMax: number         // 0.35
  floorPower: number       // 2.0
  gateCentre: number       // 0.4
  gateWidth: number        // 0.08
  consolidationGain: number // 0.6
  minRateScale: number     // 0.1
  stabilityDecay: number   // 0.01
}

function sigmoidGate(value: number, center: number, width: number): number
function softFloorDecayStep(activation: number, impact: number, stability: number, params: DecayParams & { lam: number }): number
function computeFloor(impact: number, activation: number, params: DecayParams): number
function projectForward(memory: DerivedMemoryState, params: DecayParams, steps: number): {tick: number, storage: number, retrieval: number}[]
```

### API Changes

#### `GET /api/db/decay-params`
New endpoint that returns the default decay parameters. These could eventually be read from the database metadata, but for now returns hardcoded defaults matching `decay.py`.

Alternatively: embed params as constants in `lib/decay-curve.ts` and skip the endpoint. This is simpler and avoids an extra round-trip. **Decision: embed as constants.**

## Visual Design

### Color System (unchanged)
The existing color tokens are well-chosen. No changes needed:
- Danger red `#f87171` — fading/storage
- Stable green `#34d399` — retrieval/reinforced
- Accent blue `#7c9cff` — stability/interactive
- Warm amber `#f5a65b` — floor/auxiliary

### New Visual Elements

**Grid backgrounds:** Subtle 24px grid on constellation and chart sections via CSS `background-image` with `linear-gradient` at ~3% opacity. Adds the "observatory" feel without competing with data.

**SVG glow filters:** `feGaussianBlur` with `feMerge` for constellation nodes and gauge rings. stdDeviation 2–4 depending on score magnitude. No glow on elements below 0.1 score (too faint to warrant the filter cost).

**Sparkline area fills:** Gradient from line color at top to transparent at bottom, 6–12% opacity. Makes the curves feel dimensional without obscuring text.

**Accent bar on gauge cards:** 3px colored bar at the bottom of each gauge card. Pure CSS `::after`.

### Animation

All animations respect `prefers-reduced-motion`:

- **Constellation glow pulse:** `opacity` oscillation on strong nodes, 3s cycle, `ease-in-out`. Disabled when reduced motion.
- **Gauge ring draw-in:** `stroke-dashoffset` transition on mount, 600ms `ease-out`. Falls back to instant render.
- **Sparkline fade-in:** `opacity` transition 200ms on mount.
- **No continuous animations** except the glow pulse (limited to 2–3 strongest nodes).

### Typography (unchanged)
Keep DM Sans / DM Mono. The existing type scale works.

## Data Flow

```
SQLite DB
  → /api/db/summary (existing)
  → SummaryPayload { meta, fastestFading, reinforcedSurvivors, spotlight, byId }
  → DashboardShell
     ├── Constellation (byId → nodes + edges from per-memory associations)
     ├── FadingMemoriesPanel (fastestFading → rows with sparklines)
     ├── ReinforcedMemoriesPanel (reinforcedSurvivors → rows with sparklines)
     └── MemoryDetailPanel (selectedMemory)
           ├── ScoreGauge x3 (storage, retrieval, stability)
           ├── DecayCurveChart (selectedMemory + decay params → projected curves)
           └── Interpretation + Associations (existing)
```

No new API calls. All decay curve computation happens client-side using the deterministic formula.

## What's NOT Changing

- Database loading mechanism (DbPicker, /api/db/summary)
- Data derivation logic (derive-state.ts, explanations.ts)
- Types (lib/types.ts)
- Association context component (cosmetic only)
- The read-only, diagnostic philosophy — no writes, no simulations, no "what-if"

## Scope Boundary

This redesign is purely visual. It does not add:
- Real-time tick simulation or playback
- Database writes or memory manipulation
- Historical snapshot storage
- Dark/light mode toggle (already dark-only)
- Mobile-specific layouts (existing responsive grid is adequate)

## Testing

- `lib/decay-curve.ts` — unit tests for `softFloorDecayStep`, `projectForward`, `computeFloor` against known values from decay.py
- Visual components — manual verification against the mockup
- `prefers-reduced-motion` — verify glow animations are disabled
- Edge cases: empty database, single memory, memory with 0 associations, memory at floor
