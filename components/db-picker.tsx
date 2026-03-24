"use client"

type DbPickerProps = {
  value: string
  onChange: (value: string) => void
  onLoad: () => void
  loading: boolean
  recentPaths: string[]
}

const presetPaths = ["memory-decay/data/memories.db", "memory-decay/cache/openai/memories.db"]

export function DbPicker({ value, onChange, onLoad, loading, recentPaths }: DbPickerProps) {
  return (
    <section className="panel panel-glow p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Database source</p>
            <h2 className="mt-2 text-2xl font-semibold">Open a memory-decay SQLite file</h2>
          </div>
          <div className="metric-chip">Read-only by design</div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter an absolute or workspace-relative SQLite path"
            className="min-h-12 flex-1 rounded-xl border border-border bg-bg-primary/70 px-4 text-sm text-text-primary outline-none transition focus:border-accent"
          />
          <button
            type="button"
            onClick={onLoad}
            disabled={loading || !value.trim()}
            className="min-h-12 rounded-xl bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load database"}
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="label">Quick presets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {presetPaths.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => onChange(path)}
                  className="metric-chip hover:border-border-strong hover:text-text-primary"
                >
                  {path}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Recent paths</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentPaths.length === 0 ? (
                <span className="text-sm text-text-muted">No recent paths yet.</span>
              ) : (
                recentPaths.map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => onChange(path)}
                    className="metric-chip hover:border-border-strong hover:text-text-primary"
                  >
                    {path}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
