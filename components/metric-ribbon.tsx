type MetricRibbonProps = {
  currentTick: number
  memoryCount: number
  associationCount: number
  spotlightLabel?: string
}

const cards = [
  {
    key: "tick",
    label: "Current tick",
    tone: "text-accent",
  },
  {
    key: "memories",
    label: "Memories loaded",
    tone: "text-accent-secondary",
  },
  {
    key: "associations",
    label: "Associations",
    tone: "text-accent-warm",
  },
]

export function MetricRibbon({
  currentTick,
  memoryCount,
  associationCount,
  spotlightLabel,
}: MetricRibbonProps) {
  const values = {
    tick: currentTick.toString(),
    memories: memoryCount.toString(),
    associations: associationCount.toString(),
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)]">
      {cards.map((card) => (
        <article key={card.key} className="panel p-5">
          <p className="label">{card.label}</p>
          <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{values[card.key as keyof typeof values]}</p>
        </article>
      ))}

      <article className="panel p-5">
        <p className="label">Suggested next inspection</p>
        <p className="mt-3 text-lg font-medium text-text-primary">
          {spotlightLabel ?? "Load a database to surface a candidate memory."}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          The spotlight memory is whichever current-state profile looks most diagnostically useful right now.
        </p>
      </article>
    </section>
  )
}
