# Dashboard Feature Expansion Design

**Date:** 2026-03-27
**Status:** In review
**Target user:** AI agent operator monitoring production memory state
**Approach:** Hybrid — integrate into existing pages + one new dedicated page

---

## Background

The dashboard currently provides basic CRUD views (list, search, detail, analytics, admin) but leaves ~20 backend admin endpoints unused. Three gaps were identified as most painful for operators:

1. No time-series visibility into how memories decay
2. No way to tune decay parameters from the dashboard (hardcoded config table)
3. No visualization of memory association networks

### Backend Prerequisites

Some features require backend endpoints that don't exist yet. These must be added to `memory-decay-core` first:

**Required new endpoints:**
- `GET /admin/decay-params` — Return current DecayEngine parameters
- `PUT /admin/decay-params` — Update parameters (partial update supported)
- `GET /admin/tick-interval` — Return current tick interval in seconds
- `PUT /admin/tick-interval` — Update tick interval
- `GET /admin/history/summary` — Aggregated activation history (time-series)
- `GET /admin/memories/{id}/history` — Per-memory activation history

**Existing endpoints used as-is:**
- `GET /admin/memories` — Paginated memory listing (already exists)
- `GET /admin/memories/{id}` — Single memory detail (already exists)

### Field Name Mapping

Backend and frontend use different field names. The API layer (`lib/api.ts`) handles mapping:

| Backend field | Frontend field | Notes |
|--------------|---------------|-------|
| `content` | `text` | Memory content text |
| `stability_score` | `stability` | Memory stability |
| `last_activated_tick` | — | Not currently used |
| `retrieval_count` | — | Not currently used |

---

## Feature 1: Time-Series Analysis (Analytics Integration)

### Scope
- Replace the "틱 히스토리" placeholder in `/analytics` with real data
- Add per-memory activation history to `/memory/[id]`

### Analytics Page Changes

**System Timeline** (replaces placeholder):
- Line chart: average `retrieval_score` across all memories over ticks
- Multi-line: per-category average decay comparison
- Area chart: count of at-risk memories (`retrieval_score < 0.3`) over time
- Data source: `GET /admin/history/summary`

**At-risk section** (existing, unchanged):
- Already lists bottom-5 memories by `storage_score`

### Memory Detail Page Changes

**Activation History** (new section below DecayChart):
- Multi-line chart: `retrieval_score`, `storage_score`, `stability` over tick history
- Overlay: predicted decay curve from current state (existing DecayChart logic)
- Markers: reinforcement events (where stability jumps)
- Data source: `GET /admin/memories/{id}/history`

### New API Functions (`lib/api.ts`)

```ts
getHistorySummary(): Promise<HistorySummary>
getMemoryHistory(id: string): Promise<ActivationRecord[]>
```

### New Types (`lib/types.ts`)

```ts
// Matches backend GET /admin/history/summary response
interface HistorySummary {
  total_memories: number
  current_tick: number
  categories: {
    category: string
    count: number
    avg_retrieval: number
    avg_storage: number
    avg_stability: number
  }[]
  // Time-series data (backend to aggregate from activation_history table)
  timeline: {
    tick: number
    avg_retrieval: number
    avg_storage: number
    avg_stability: number
    at_risk_count: number
  }[]
}

// Matches backend GET /admin/memories/{id}/history response
interface ActivationRecord {
  tick: number
  retrieval_score: number
  storage_score: number
  stability: number
  recorded_at: number  // Unix timestamp
}
```

### Data Transformation

The `api.ts` layer transforms backend responses:
- `categories` array → grouped per-category charts
- `timeline` array → line chart data for system overview
- Field names mapped (`stability_score` → `stability` where needed)

---

## Feature 2: Configuration Control (Admin Integration)

### Scope
- Replace hardcoded settings table with live editable form
- Add tick-interval configuration

### Admin Page Changes

**Decay Parameters** (replaces static table):
- **Backend prerequisite:** `GET /admin/decay-params` and `PUT /admin/decay-params` must be added to `memory-decay-core`
- Fetch current params from `GET /admin/decay-params`
- Editable form with grouped sections:

  **Basic Decay:**
  - `lambda_fact` (range 0.001–0.1, step 0.001)
  - `lambda_episode` (range 0.001–0.1, step 0.001)
  - `alpha` (range 0.0–2.0, step 0.05)

  **Stability:**
  - `stability_weight` (range 0.0–2.0, step 0.05)
  - `stability_decay` (range 0.0–0.1, step 0.005)
  - `stability_cap` (range 0.5–2.0, step 0.1)

  **Reinforcement:**
  - `reinforcement_gain_direct` (range 0.0–1.0, step 0.01)
  - `reinforcement_gain_assoc` (range 0.0–0.5, step 0.01)

  **Soft-Floor:**
  - `floor_min` (range 0.0–0.2, step 0.01)
  - `floor_max` (range 0.1–0.5, step 0.01)
  - `floor_power` (range 0.5–5.0, step 0.1)
  - `gate_center` (range 0.0–1.0, step 0.05)
  - `gate_width` (range 0.01–0.5, step 0.01)

- Each field: slider + numeric input (synced)
- Save button → `PUT /admin/decay-params`
- "Restore defaults" button
- Unsaved changes indicator (dot or text)

**Tick Interval** (new section below force-tick):
- Current interval display (from `GET /admin/tick-interval`)
- Editable number input (seconds)
- Save → `PUT /admin/tick-interval`

### UX Details
- Collapsible sections (each parameter group)
- Validation: min/max range enforcement on blur
- Optimistic update: show new values immediately, revert on error
- Confirmation dialog before save (affects all running decay)

### New API Functions

```ts
getDecayParams(): Promise<DecayParams>
updateDecayParams(params: Partial<DecayParams>): Promise<void>
getTickInterval(): Promise<{ interval: number }>
updateTickInterval(seconds: number): Promise<void>
```

### New Types

```ts
interface DecayParams {
  lambda_fact: number
  lambda_episode: number
  beta_fact?: number
  beta_episode?: number
  alpha: number
  stability_weight: number
  stability_decay: number
  stability_cap: number
  reinforcement_gain_direct: number
  reinforcement_gain_assoc: number
  floor_min?: number
  floor_max?: number
  floor_power?: number
  gate_center?: number
  gate_width?: number
  min_rate_scale?: number
  consolidation_gain?: number
}
```

---

## Feature 3: Association Graph (New `/graph` Page)

### Scope
- New dedicated page for interactive memory network visualization
- Sidebar menu entry added

### Graph View

**Visualization:**
- D3.js force-directed layout (SVG)
- Nodes = memories, edges = associations
- Node size: proportional to `importance`
- Node color: mapped from `retrieval_score` (bright = high, dim = low)
- Edge thickness: proportional to association `weight`
- Drag nodes, zoom, pan

**Interactivity:**
- Click node → side panel with memory summary + link to `/memory/{id}`
- Category filter checkboxes (show/hide node types)
- Activity threshold slider: nodes below threshold become semi-transparent or hidden
- Search highlight: type query, matching nodes get highlighted border

**Data Loading:**
- Load all memories + associations on mount
- Build adjacency list client-side from memory `associations` field
- Fallback: if association data is sparse, use semantic similarity (future)

**Performance:**
- D3 force simulation with charge, link, center forces
- Dynamic import (`next/dynamic` + `ssr: false`) since D3 needs browser APIs
- Virtualization not needed for typical memory counts (hundreds, not thousands)

### Sidebar Change
- Add "연관 그래프" item between "분석" and "관리"

### New Files
- `app/graph/page.tsx` — page wrapper
- `components/association-graph.tsx` — D3 graph component

### New API Functions
- Reuses existing `getAllMemories()` and association data from memory objects
- Optional: `GET /admin/associations/{id}` for detailed edge data if needed

---

## Implementation Priority

1. **Time-Series Analysis** — highest operator impact, builds on existing Analytics page
2. **Configuration Control** — removes hardcoded values, enables live tuning
3. **Association Graph** — most complex, most visually impressive, built last

Each feature is independently deployable.

---

## File Change Summary

| File | Change |
|------|--------|
| `lib/api.ts` | Add 6 new API functions |
| `lib/types.ts` | Add `HistorySummary`, `ActivationRecord`, `DecayParams` types |
| `app/analytics/page.tsx` | Replace placeholder with real timeline charts |
| `app/memory/[id]/page.tsx` | Add activation history section |
| `app/admin/page.tsx` | Replace static table with editable params form |
| `app/graph/page.tsx` | New page |
| `components/association-graph.tsx` | New D3 graph component |
| `components/sidebar.tsx` | Add graph menu item |
| `components/param-editor.tsx` | New: reusable parameter slider+input |

---

## Out of Scope

- Custom decay function upload/management UI
- Embedding cache management UI
- Multi-user isolation/filtering
- Real-time WebSocket updates (polling is sufficient for operator use case)
- Batch operations UI (bulk reinforce, etc.)
