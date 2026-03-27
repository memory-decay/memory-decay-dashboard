"use client"

import { useState, useEffect, useCallback } from "react"
import { DecayParams, DEFAULT_DECAY_PARAMS, DECAY_PARAM_GROUPS, DecayParamMeta } from "@/lib/types"
import { getDecayParams, updateDecayParams } from "@/lib/api"

export default function ParamEditor() {
  const [params, setParams] = useState<DecayParams>({ ...DEFAULT_DECAY_PARAMS })
  const [saved, setSaved] = useState<DecayParams>({ ...DEFAULT_DECAY_PARAMS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null)

  useEffect(() => {
    getDecayParams().then(p => {
      setParams(p)
      setSaved(p)
      setLoading(false)
    })
  }, [])

  const dirty = JSON.stringify(params) !== JSON.stringify(saved)

  const update = useCallback((key: keyof DecayParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  async function handleSave() {
    if (!confirm("감쇠 파라미터를 변경하면 모든 메모리의 감쇠 동작에 즉시 영향을 줍니다. 저장하시겠습니까?")) return
    setSaving(true)
    setMessage(null)
    try {
      await updateDecayParams(params)
      setSaved({ ...params })
      setMessage({ text: "저장되었습니다.", type: "ok" })
    } catch {
      setMessage({ text: "서버에 연결할 수 없습니다.", type: "err" })
    }
    setSaving(false)
  }

  function handleReset() {
    setParams({ ...DEFAULT_DECAY_PARAMS })
    setMessage(null)
  }

  function handleRevert() {
    setParams({ ...saved })
    setMessage(null)
  }

  if (loading) return <div className="text-text-muted text-sm">파라미터 불러오는 중...</div>

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "ok" ? "bg-accent-secondary/10 text-accent-secondary" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {DECAY_PARAM_GROUPS.map(group => (
        <details key={group.group} open={group.group === "basic"} className="panel overflow-hidden">
          <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated/40 transition-colors">
            {group.label}
          </summary>
          <div className="space-y-4 px-5 pb-5 pt-2">
            {group.params.map(meta => (
              <ParamRow
                key={meta.key}
                meta={meta}
                value={params[meta.key]}
                onChange={v => update(meta.key, v)}
              />
            ))}
          </div>
        </details>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary disabled:opacity-40">
          {saving ? "저장 중..." : "저장"}
        </button>
        {dirty && (
          <button onClick={handleRevert} className="btn-secondary">되돌리기</button>
        )}
        <button onClick={handleReset} className="btn-secondary ml-auto">기본값 복원</button>
        {dirty && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
            변경됨
          </span>
        )}
      </div>
    </div>
  )
}

function ParamRow({ meta, value, onChange }: { meta: DecayParamMeta; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">{meta.label}</label>
        <input
          type="number"
          min={meta.min}
          max={meta.max}
          step={meta.step}
          value={value}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.min(meta.max, Math.max(meta.min, v)))
          }}
          onBlur={() => onChange(Math.min(meta.max, Math.max(meta.min, value)))}
          className="w-20 rounded border border-border bg-bg-primary px-2 py-1 text-right font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
        />
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent h-1.5"
      />
    </div>
  )
}
