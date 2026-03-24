# memory-decay-dashboard

Standalone, read-only dashboard for compatible `memory-decay` SQLite databases.

## What it does

- Opens standard user-memory DBs and LongMemEval-compatible DBs through the same path workflow
- Surfaces:
  - fastest-fading memories
  - reinforced / surviving memories
  - a detailed per-memory inspection view
- Explains decay and reinforcement from **current-state fields**, not fake replay history

## What it does not do

- No edit/delete controls
- No raw SQL explorer
- No admin / operations management surface
- No claim of exact temporal replay unless a future history layer is added

## Supported schema

Phase 1 reads these tables when present:

- `memories` (required)
- `associations` (optional but supported)
- `metadata` (optional but used for `current_tick`)

`vec_memories` is intentionally ignored for dashboard rendering in Phase 1.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
node --import tsx --test tests/**/*.test.ts
```

## Notes

- SQLite access is server-side and read-only.
- If `metadata.current_tick` is absent, the dashboard derives an effective current tick from the max observed created/activated/reinforced tick.
- LongMemEval verification should use offline-compatible fixtures rather than live embedding APIs.
