"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { searchMemories } from "@/lib/api"
import { SearchResult, getFreshnessStatus } from "@/lib/types"
import StatusBadge from "@/components/status-badge"

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(q?: string) {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setLoading(true)
    const res = await searchMemories(searchQuery.trim())
    setResults(res)
    setSearched(true)
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handleSearch()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">메모리 검색</h1>
        <p className="text-sm text-text-muted">시맨틱 검색으로 메모리를 찾습니다</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="input-field flex-1"
          autoFocus
        />
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <div className="mb-3 text-sm text-text-muted">
            {results.length}개의 결과
          </div>

          {results.length === 0 ? (
            <div className="panel p-8 text-center text-text-muted">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/memory/${result.id}`}
                  className="block panel p-4 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-relaxed">{result.text}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                        <span className="rounded bg-bg-elevated px-2 py-0.5">{result.category}</span>
                        <span>중요도: <span className="font-mono text-accent">{result.importance.toFixed(2)}</span></span>
                        <span>틱: <span className="font-mono">{result.created_tick}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={getFreshnessStatus(result.freshness)} />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-text-muted">점수</span>
                        <span className="font-mono text-sm font-bold text-accent-secondary">{result.score.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-text-muted">불러오는 중...</div>}>
      <SearchContent />
    </Suspense>
  )
}
