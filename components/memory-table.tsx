"use client"

import { useState } from "react"
import Link from "next/link"
import { Memory, SortField, SortDirection, getFreshnessStatus } from "@/lib/types"
import StatusBadge from "./status-badge"

interface MemoryTableProps {
  memories: Memory[]
}

const SORT_LABELS: Record<SortField, string> = {
  importance: "중요도",
  retrieval_score: "활성도",
  created_tick: "생성 틱",
  category: "카테고리",
  storage_score: "저장 점수",
}

const MTYPE_LABELS: Record<string, string> = {
  fact: "사실",
  episode: "에피소드",
  decision: "결정",
  preference: "선호",
}

export default function MemoryTable({ memories }: MemoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("retrieval_score")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

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
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <th key={field} className="table-header">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    {SORT_LABELS[field]}
                    {sortField === field && (
                      <span className="text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
              ))}
              <th className="table-header">유형</th>
              <th className="table-header">상태</th>
              <th className="table-header">내용</th>
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
                    {MTYPE_LABELS[memory.mtype] || memory.mtype}
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
