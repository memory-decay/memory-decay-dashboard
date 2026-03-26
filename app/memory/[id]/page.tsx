"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getMemoryById, forgetMemory, advanceTick } from "@/lib/api"
import { Memory, getFreshnessStatus } from "@/lib/types"
import { MOCK_MEMORIES } from "@/lib/mock-data"
import { ticksUntilThreshold } from "@/lib/decay"
import StatusBadge from "@/components/status-badge"
import ScoreDisplay from "@/components/score-display"
import DecayChart from "@/components/decay-chart"

const MTYPE_LABELS: Record<string, string> = {
  fact: "사실",
  episode: "에피소드",
  decision: "결정",
  preference: "선호",
}

export default function MemoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [memory, setMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const m = await getMemoryById(id)
      setMemory(m || MOCK_MEMORIES[0])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleForget() {
    if (!memory) return
    if (!confirm("이 메모리를 삭제하시겠습니까?")) return
    try {
      await forgetMemory(memory.id)
      router.push("/")
    } catch {
      alert("서버에 연결할 수 없습니다.")
    }
  }

  async function handleReinforce() {
    if (!memory) return
    try {
      // Reinforcement is simulated by storing the same text again with higher importance
      await advanceTick(0) // trigger retrieval reinforcement
      setMemory(prev => prev ? { ...prev, retrieval_score: Math.min(1, prev.retrieval_score + 0.1) } : prev)
    } catch {
      // Offline simulation
      setMemory(prev => prev ? { ...prev, retrieval_score: Math.min(1, prev.retrieval_score + 0.1) } : prev)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">불러오는 중...</div>
  }

  if (!memory) {
    return <div className="flex items-center justify-center h-64 text-text-muted">메모리를 찾을 수 없습니다.</div>
  }

  const estimatedLife = ticksUntilThreshold(memory.retrieval_score, memory.importance, memory.stability)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/" className="hover:text-text-primary transition-colors">대시보드</Link>
        <span>/</span>
        <span className="text-text-secondary">메모리 상세</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-text-primary">메모리 상세</h1>
            <StatusBadge status={getFreshnessStatus(memory.freshness)} />
          </div>
          <p className="font-mono text-xs text-text-muted">{memory.id}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReinforce} className="btn-primary">강화</button>
          <button onClick={handleForget} className="btn-danger">삭제</button>
        </div>
      </div>

      {/* Memory text */}
      <div className="panel p-5">
        <div className="label mb-2">내용</div>
        <p className="text-text-primary leading-relaxed">{memory.text}</p>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stat-card">
          <div className="label mb-1">카테고리</div>
          <div className="text-sm font-medium text-text-primary">{memory.category}</div>
        </div>
        <div className="stat-card">
          <div className="label mb-1">유형</div>
          <div className="text-sm font-medium text-text-primary">{MTYPE_LABELS[memory.mtype] || memory.mtype}</div>
        </div>
        <div className="stat-card">
          <div className="label mb-1">중요도</div>
          <div className="font-mono text-lg font-bold text-accent">{memory.importance.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label mb-1">생성 틱</div>
          <div className="font-mono text-lg font-bold text-text-primary">{memory.created_tick}</div>
        </div>
      </div>

      {/* Scores */}
      <div className="panel p-5">
        <div className="label mb-4">현재 점수</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreDisplay label="검색 점수" value={memory.retrieval_score} color="accent" />
          <ScoreDisplay label="저장 점수" value={memory.storage_score} color="secondary" />
          <ScoreDisplay label="안정성" value={memory.stability} color="stable" />
          <ScoreDisplay label="신선도" value={memory.freshness} color="warm" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-bg-primary/60 p-3">
          <span className="text-xs text-text-muted">예상 수명:</span>
          <span className="font-mono text-sm font-bold text-accent-secondary">
            ~{estimatedLife === Infinity ? "∞" : estimatedLife}틱
          </span>
          <span className="text-xs text-text-muted">(활성도 &lt; 0.01 까지)</span>
        </div>
      </div>

      {/* Decay chart */}
      <DecayChart
        initialActivation={memory.retrieval_score}
        importance={memory.importance}
        stability={memory.stability}
      />

      {/* Associations */}
      {memory.associations.length > 0 && (
        <div className="panel p-5">
          <div className="label mb-3">연관 메모리</div>
          <div className="flex flex-wrap gap-2">
            {memory.associations.map((assocId) => (
              <Link
                key={assocId}
                href={`/memory/${assocId}`}
                className="rounded-lg border border-border bg-bg-primary/60 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/10 transition-colors"
              >
                {assocId}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Speaker */}
      {memory.speaker && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>화자:</span>
          <span className="rounded bg-bg-elevated px-2 py-0.5 text-text-secondary">{memory.speaker}</span>
        </div>
      )}
    </div>
  )
}
