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
