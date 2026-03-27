"use client"

import { useState } from "react"
import Link from "next/link"
import { Memory, SortField, SortDirection, getFreshnessStatus, MTYPE_LABELS } from "@/lib/types"
import { useTranslations } from "next-intl"
import StatusBadge from "./status-badge"

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

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {SORT_FIELD_KEYS.map((field) => (
                <th key={field} className="table-header">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    {t(`sortField.${field}`)}
                    {sortField === field && (
                      <span className="text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
              ))}
              <th className="table-header">{t('type')}</th>
              <th className="table-header">{t('status')}</th>
              <th className="table-header">{t('content')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((memory) => (
              <tr key={memory.id} className="hover:bg-bg-elevated/40 transition-colors">
                <td className="table-cell font-mono text-accent">
                  {memory.importance.toFixed(2)}
                </td>
                <td className="table-cell font-mono">
                  {memory.retrieval_score.toFixed(2)}
                </td>
                <td className="table-cell font-mono text-text-muted">
                  {memory.created_tick}
                </td>
                <td className="table-cell">
                  <span className="inline-flex rounded-md bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary">
                    {memory.category}
                  </span>
                </td>
                <td className="table-cell font-mono">
                  {memory.storage_score.toFixed(2)}
                </td>
                <td className="table-cell">
                  <span className="inline-flex rounded-md bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
                    {tTypes(MTYPE_LABELS[memory.mtype] || memory.mtype)}
                  </span>
                </td>
                <td className="table-cell">
                  <StatusBadge status={getFreshnessStatus(memory.freshness)} />
                </td>
                <td className="table-cell max-w-xs">
                  <Link
                    href={`/memory/${memory.id}`}
                    className="block truncate text-text-primary hover:text-accent transition-colors"
                  >
                    {memory.text}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
