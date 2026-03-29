# memory-decay-dashboard

Read-only dashboard for visualizing `memory-decay` engine state — decay curves, memory health, reinforcement history, and more.

## Quick Start

```bash
npm install -g memory-decay-dashboard
decay-dashboard
# → Open http://localhost:3000
```

That's it. The dashboard connects to your memory-decay server at `http://localhost:8100` by default.

## Prerequisites

- **Node.js** ≥ 18
- **memory-decay server** running (the Python backend started by the OpenClaw plugin, or manually via `python -m memory_decay.server`)

## CLI Usage

```bash
decay-dashboard                       # Start on http://localhost:3000
decay-dashboard --port 4000           # Custom port
decay-dashboard --api http://host:8100  # Custom memory-decay server URL
decay-dashboard --help
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port <number>` | Dashboard port | `3000` |
| `--api <url>` | Memory-decay server URL | `http://localhost:8100` |

## Development (from source)

```bash
git clone https://github.com/memory-decay/memory-decay-dashboard.git
cd memory-decay-dashboard
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run typecheck
```

## What it shows

- **Memory overview** — total memories, current tick, storage/retrieval score distributions
- **Fastest-fading memories** — memories decaying most rapidly
- **Surviving memories** — well-reinforced memories with high stability
- **Per-memory inspection** — detailed view of individual memory state, associations, and decay projection
- **Decay parameters** — view and adjust λ, α, ρ
- **Tick controls** — advance ticks manually or view auto-tick interval

## What it doesn't do

- No edit/delete controls (read-only by design)
- No raw SQL explorer
- No admin/operations management

## Architecture

```
memory-decay-dashboard (Next.js)
  → REST API calls → memory-decay server (Python, port 8100)
    → SQLite (memories.db)
```

The dashboard is a pure frontend — it never touches the SQLite database directly. All data flows through the memory-decay server's REST API.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Memory-decay server URL | `http://localhost:8100` |
| `PORT` | Dashboard port | `3000` |

## License

MIT
