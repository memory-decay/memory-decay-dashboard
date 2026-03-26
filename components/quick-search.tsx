"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function QuickSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="메모리 검색..."
        className="input-field pl-10"
      />
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">⊘</span>
    </form>
  )
}
