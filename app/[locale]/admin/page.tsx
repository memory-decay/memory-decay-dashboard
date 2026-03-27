"use client"

import { useState, useEffect } from "react"
import { storeMemory, resetMemories, advanceTick, getTickInterval, updateTickInterval } from "@/lib/api"
import { StoreRequest } from "@/lib/types"
import ParamEditor from "@/components/param-editor"

const MTYPE_OPTIONS = [
  { value: "fact", label: "사실" },
  { value: "episode", label: "에피소드" },
  { value: "decision", label: "결정" },
  { value: "preference", label: "선호" },
]

export default function AdminPage() {
  const [tickCount, setTickCount] = useState(10)
  const [tickInterval, setTickInterval] = useState(3600)
  const [savedInterval, setSavedInterval] = useState(3600)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getTickInterval().then(data => {
      setTickInterval(data.interval)
      setSavedInterval(data.interval)
    }).catch(() => {})
  }, [])

  // New memory form
  const [newMemory, setNewMemory] = useState<StoreRequest>({
    text: "",
    importance: 0.5,
    mtype: "fact",
    category: "",
  })

  async function handleForceTick() {
    setLoading(true)
    setStatus(null)
    try {
      const result = await advanceTick(tickCount)
      setStatus(`${tickCount}틱 진행 완료. 현재 틱: ${result.current_tick}`)
    } catch {
      setStatus("서버에 연결할 수 없습니다.")
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!confirm("모든 메모리를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return
    setLoading(true)
    setStatus(null)
    try {
      const result = await resetMemories()
      setStatus(`초기화 완료. ${result.cleared}개 메모리 삭제됨.`)
    } catch {
      setStatus("서버에 연결할 수 없습니다.")
    }
    setLoading(false)
  }

  async function handleStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newMemory.text.trim() || !newMemory.category.trim()) {
      setStatus("텍스트와 카테고리를 입력하세요.")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const result = await storeMemory(newMemory)
      setStatus(`메모리 저장 완료: ${result.id} (틱 ${result.tick})`)
      setNewMemory({ text: "", importance: 0.5, mtype: "fact", category: "" })
    } catch {
      setStatus("서버에 연결할 수 없습니다.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">관리</h1>
        <p className="text-sm text-text-muted">시스템 제어 및 메모리 관리</p>
      </div>

      {/* Status message */}
      {status && (
        <div className="rounded-lg border border-border bg-bg-elevated/80 px-4 py-3 text-sm text-text-secondary">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global controls */}
        <div className="panel p-5 space-y-5">
          <div className="label">전역 제어</div>

          {/* Force tick */}
          <div className="space-y-3">
            <div className="text-sm text-text-secondary">강제 틱 진행</div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={1000}
                value={tickCount}
                onChange={(e) => setTickCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field w-24"
              />
              <button
                onClick={handleForceTick}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {tickCount}틱 진행
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="space-y-3 border-t border-border pt-5">
            <div className="text-sm text-text-secondary">메모리 초기화</div>
            <p className="text-xs text-text-muted">모든 메모리를 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
            <button
              onClick={handleReset}
              disabled={loading}
              className="btn-danger disabled:opacity-50"
            >
              전체 초기화
            </button>
          </div>
        </div>

        {/* Add new memory */}
        <div className="panel p-5">
          <div className="label mb-4">새 메모리 추가</div>
          <form onSubmit={handleStore} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-text-muted">텍스트</label>
              <textarea
                value={newMemory.text}
                onChange={(e) => setNewMemory(prev => ({ ...prev, text: e.target.value }))}
                placeholder="메모리 내용을 입력하세요..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">유형</label>
                <select
                  value={newMemory.mtype}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, mtype: e.target.value as StoreRequest["mtype"] }))}
                  className="input-field"
                >
                  {MTYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">카테고리</label>
                <input
                  type="text"
                  value={newMemory.category}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="예: 아키텍처"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">
                중요도: <span className="font-mono text-accent">{newMemory.importance.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={newMemory.importance}
                onChange={(e) => setNewMemory(prev => ({ ...prev, importance: parseFloat(e.target.value) }))}
                className="w-full accent-accent"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              메모리 저장
            </button>
          </form>
        </div>
      </div>

      {/* Tick interval */}
      <div className="panel p-5 space-y-4">
        <div className="label">틱 간격</div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={60}
            max={86400}
            step={60}
            value={tickInterval}
            onChange={e => setTickInterval(Math.max(60, parseInt(e.target.value) || 60))}
            className="input-field w-28"
          />
          <span className="text-sm text-text-muted">초</span>
          <button
            onClick={async () => {
              try {
                await updateTickInterval(tickInterval)
                setSavedInterval(tickInterval)
                setStatus(`틱 간격이 ${tickInterval}초로 변경되었습니다.`)
              } catch {
                setStatus("틱 간격 변경에 실패했습니다.")
              }
            }}
            disabled={tickInterval === savedInterval}
            className="btn-primary disabled:opacity-40"
          >
            저장
          </button>
        </div>
        <p className="text-xs text-text-muted">
          현재: {savedInterval}초 ({(savedInterval / 60).toFixed(0)}분)
        </p>
      </div>

      {/* Decay params editor */}
      <div className="panel p-5">
        <div className="label mb-4">감쇠 파라미터</div>
        <ParamEditor />
      </div>
    </div>
  )
}
