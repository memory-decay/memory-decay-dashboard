import { AssociationContext } from "@/components/association-context"
import type { DerivedMemoryState } from "@/lib/types"

export function MemoryDetailPanel({ memory }: { memory: DerivedMemoryState | null }) {
  return (
    <section className="panel min-h-[32rem] p-6">
      {!memory ? (
        <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-border bg-bg-primary/35 p-8 text-center text-text-secondary">
          Load a database and select a memory to inspect its current decay and reinforcement state.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label">Memory detail</p>
              <h2 className="mt-2 text-3xl font-semibold">{memory.id}</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">{memory.content}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="metric-chip">{memory.mtype}</span>
              <span className="metric-chip">speaker {memory.speaker || "unknown"}</span>
              <span className="metric-chip">importance {memory.importance.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-bg-primary/50 p-4">
              <p className="label">Storage score</p>
              <p className="mt-2 text-3xl font-semibold text-status-danger">
                {memory.storage_score.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-primary/50 p-4">
              <p className="label">Retrieval score</p>
              <p className="mt-2 text-3xl font-semibold text-status-stable">
                {memory.retrieval_score.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-primary/50 p-4">
              <p className="label">Inactive ticks</p>
              <p className="mt-2 text-3xl font-semibold text-text-primary">{memory.inactiveTicks}</p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-primary/50 p-4">
              <p className="label">Age ticks</p>
              <p className="mt-2 text-3xl font-semibold text-text-primary">{memory.ageTicks}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-2xl border border-border bg-bg-primary/45 p-5">
              <p className="label">Current-state interpretation</p>
              <p className="mt-3 text-lg font-medium leading-7 text-text-primary">
                {memory.explanation.summary}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-text-secondary">
                {memory.explanation.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-bg-primary/45 p-5">
              <p className="label">Stored fields</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <DetailField label="Created tick" value={memory.created_tick} />
                <DetailField label="Last activated" value={memory.last_activated_tick} />
                <DetailField label="Last reinforced" value={memory.last_reinforced_tick} />
                <DetailField label="Age ticks" value={memory.ageTicks} />
                <DetailField label="Storage" value={memory.storage_score.toFixed(2)} />
                <DetailField label="Retrieval" value={memory.retrieval_score.toFixed(2)} />
                <DetailField label="Stability" value={memory.stability_score.toFixed(2)} />
                <DetailField label="Retrieval count" value={memory.retrieval_count} />
                <DetailField label="Associations" value={memory.associations.length} />
              </dl>
            </article>
          </div>

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
    <div className="rounded-xl border border-border bg-bg-surface/80 p-3">
      <dt className="text-xs uppercase tracking-[0.22em] text-text-muted">{label}</dt>
      <dd className="mt-2 text-base font-medium text-text-primary">{value}</dd>
    </div>
  )
}
