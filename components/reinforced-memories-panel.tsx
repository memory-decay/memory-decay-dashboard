import { MemoryListPanel } from "@/components/memory-list-panel"
import type { DerivedMemoryState } from "@/lib/types"

type ReinforcedMemoriesPanelProps = {
  memories: DerivedMemoryState[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function ReinforcedMemoriesPanel({
  memories,
  selectedId,
  onSelect,
}: ReinforcedMemoriesPanelProps) {
  return (
    <MemoryListPanel
      eyebrow="Most preserved"
      title="Memories with the highest stored decay score"
      badge="Ranked by storage score"
      scoreLabel="Storage"
      scoreToneClassName="text-status-stable"
      formatScore={(value) => value.toFixed(2)}
      memories={memories}
      selectedId={selectedId}
      onSelect={onSelect}
      score={(memory) => memory.storage_score}
      chips={(memory) => [
        `retrieval ${memory.retrieval_score.toFixed(2)}`,
        `inactive ${memory.inactiveTicks}t`,
        `stability ${memory.stability_score.toFixed(2)}`,
      ]}
    />
  )
}
