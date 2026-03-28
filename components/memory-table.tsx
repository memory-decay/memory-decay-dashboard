"use client"

import { useState } from "react"
import Link from "next/link"
import { Memory, SortField, SortDirection, getFreshnessStatus, MTYPE_LABELS } from "@/lib/types"
import { useTranslations } from "next-intl"
import StatusBadge from "./status-badge"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface MemoryTableProps {
  memories: Memory[]
}

const SORT_FIELD_KEYS: SortField[] = [
  "importance",
  "retrieval_score",
  "created_tick",
  "category",
  "storage_score",
]

// Color coding for memory types — bold colored borders
const MTYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  fact: {
    bg: "bg-accent-orange/15",
    text: "text-accent-orange",
    border: "border-accent-orange",
  },
  episode: {
    bg: "bg-accent-warm/15",
    text: "text-accent-warm",
    border: "border-accent-warm",
  },
  decision: {
    bg: "bg-status-stable/15",
    text: "text-status-stable",
    border: "border-status-stable",
  },
  preference: {
    bg: "bg-status-info/15",
    text: "text-status-info",
    border: "border-status-info",
  },
}

// Color coding for importance levels
function getImportanceStyle(importance: number): { text: string; bg: string } {
  if (importance >= 0.8) return { text: "text-status-stable", bg: "bg-status-stable/10" }
  if (importance >= 0.6) return { text: "text-accent", bg: "bg-accent/10" }
  if (importance >= 0.4) return { text: "text-accent-yellow", bg: "bg-accent-yellow/10" }
  if (importance >= 0.2) return { text: "text-accent-orange", bg: "bg-accent-orange/10" }
  return { text: "text-text-muted", bg: "bg-bg-elevated" }
}

// Color coding for retrieval scores
function getRetrievalStyle(score: number): { text: string; bg: string } {
  if (score >= 0.7) return { text: "text-status-stable", bg: "bg-status-stable/10" }
  if (score >= 0.4) return { text: "text-accent-warm", bg: "bg-accent-warm/10" }
  return { text: "text-status-danger", bg: "bg-status-danger/10" }
}

export default function MemoryTable({ memories }: MemoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("retrieval_score")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const t = useTranslations('table')
  const tTypes = useTranslations('types')

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = [...memories].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    const diff = (aVal as number) - (bVal as number)
    return sortDir === "asc" ? diff : -diff
  })

  // Sort indicator component
  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-text-muted opacity-50" />
    }
    return sortDir === "asc"
      ? <ArrowUp size={12} className="text-accent" />
      : <ArrowDown size={12} className="text-accent" />
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[3px] border-border">
              {SORT_FIELD_KEYS.map((field) => (
                <th key={field} className="table-header">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 hover:text-text-primary transition-colors"
                  >
                    {t(`sortField.${field}`)}
                    <SortIndicator field={field} />
                  </button>
                </th>
              ))}
              <th className="table-header">{t('type')}</th>
              <th className="table-header">{t('status')}</th>
              <th className="table-header">{t('content')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((memory) => {
              const mtypeStyle = MTYPE_STYLES[memory.mtype] || MTYPE_STYLES.fact
              const importanceStyle = getImportanceStyle(memory.importance)
              const retrievalStyle = getRetrievalStyle(memory.retrieval_score)

              return (
                <tr
                  key={memory.id}
                  className="group transition-all hover:bg-bg-elevated/60 hover:shadow-[inset_4px_0_0_rgb(var(--accent))]"
                >
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-mono font-bold ${importanceStyle.bg} ${importanceStyle.text} border-2 ${importanceStyle.text.replace('text-', 'border-')}`}>
                      {memory.importance.toFixed(2)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-mono font-bold ${retrievalStyle.bg} ${retrievalStyle.text} border-2 ${retrievalStyle.text.replace('text-', 'border-')}`}>
                      {memory.retrieval_score.toFixed(2)}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-text-muted">
                    {memory.created_tick}
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary border-2 border-border">
                      {memory.category}
                    </span>
                  </td>
                  <td className="table-cell font-mono">
                    {memory.storage_score.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${mtypeStyle.bg} ${mtypeStyle.text} border-2 ${mtypeStyle.border}`}>
                      {tTypes(MTYPE_LABELS[memory.mtype] || memory.mtype)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={getFreshnessStatus(memory.freshness)} />
                  </td>
                  <td className="table-cell max-w-xs">
                    <Link
                      href={`/memory/${memory.id}`}
                      className="block truncate text-text-primary hover:text-accent font-medium transition-colors"
                    >
                      {memory.text}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
