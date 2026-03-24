import type { MemoryAssociationSummary } from "@/lib/types"

export function AssociationContext({ associations }: { associations: MemoryAssociationSummary[] }) {
  if (associations.length === 0) {
    return <p className="text-sm text-text-muted">No stored associations for this memory.</p>
  }

  return (
    <div className="space-y-2">
      {associations.slice(0, 6).map((association) => (
        <div
          key={`${association.targetId}-${association.createdTick}`}
          className="rounded-xl border border-border bg-bg-primary/45 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-text-primary">{association.targetId}</span>
            <span className="metric-chip">weight {association.weight.toFixed(2)}</span>
          </div>
          {association.targetPreview ? (
            <p className="mt-2 text-sm text-text-secondary">{association.targetPreview}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
