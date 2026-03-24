import { MemoryListPanel } from "@/components/memory-list-panel"
import type { DerivedMemoryState } from "@/lib/types"

type FadingMemoriesPanelProps = {
  memories: DerivedMemoryState[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function FadingMemoriesPanel({
  memories,
  selectedId,
  onSelect,
}: FadingMemoriesPanelProps) {
  return (
    <MemoryListPanel
      eyebrow="Fastest fading"
      title="Memories with the lowest stored decay score"
      badge="Ranked by storage score"
      scoreLabel="Storage"
      scoreToneClassName="text-status-danger"
      formatScore={(value) => value.toFixed(2)}
      memories={memories}
      selectedId={selectedId}
      onSelect={onSelect}
      score={(memory) => memory.storage_score}
      chips={(memory) => [
        `inactive ${memory.inactiveTicks}t`,
        `retrieval ${memory.retrieval_score.toFixed(2)}`,
        `stability ${memory.stability_score.toFixed(2)}`,
      ]}
    />
  )
}
