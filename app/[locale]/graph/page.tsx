"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { getAllMemories } from "@/lib/api"
import { Memory } from "@/lib/types"

const AssociationGraph = dynamic(() => import("@/components/association-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] text-text-muted text-sm">
      그래프 불러오는 중...
    </div>
  ),
})

export default function GraphPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllMemories().then(m => {
      setMemories(m)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">연관 그래프</h1>
        <p className="text-sm text-text-muted">메모리 간 연관 관계 시각화</p>
        {loading && <span className="text-xs text-text-muted ml-2">불러오는 중...</span>}
      </div>

      {!loading && <AssociationGraph memories={memories} />}
    </div>
  )
}
