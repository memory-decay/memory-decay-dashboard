import type { DerivedMemoryState } from "@/lib/types"

type MemoryListPanelProps = {
  title: string
  eyebrow: string
  badge: string
  scoreLabel: string
  scoreToneClassName: string
  formatScore?: (value: number) => string
  memories: DerivedMemoryState[]
  selectedId?: string
  onSelect: (id: string) => void
  chips: (memory: DerivedMemoryState) => string[]
  score: (memory: DerivedMemoryState) => number
}

export function MemoryListPanel({
  title,
  eyebrow,
  badge,
  scoreLabel,
  scoreToneClassName,
  formatScore = (value) => `${Math.round(value * 100)}`,
  memories,
  selectedId,
  onSelect,
  chips,
  score,
}: MemoryListPanelProps) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">{eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold">{title}</h3>
        </div>
        <div className="metric-chip">{badge}</div>
      </div>

      <div className="mt-4 space-y-3">
        {memories.slice(0, 5).map((memory) => (
          <button
            key={memory.id}
            type="button"
            onClick={() => onSelect(memory.id)}
            className={`memory-row ${selectedId === memory.id ? "memory-row-active" : ""}`}
          >
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
            <div className="mt-3 flex flex-wrap gap-2">
              {chips(memory).map((chip) => (
                <span key={`${memory.id}-${chip}`} className="metric-chip">
                  {chip}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
