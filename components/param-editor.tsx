"use client"

import { useState, useEffect, useCallback } from "react"
import { DecayParams, DEFAULT_DECAY_PARAMS, DECAY_PARAM_GROUPS, DecayParamMeta } from "@/lib/types"
import { getDecayParams, updateDecayParams } from "@/lib/api"
import { useTranslations } from "next-intl"

export default function ParamEditor() {
  const t = useTranslations('paramEditor')
  const tTypes = useTranslations('types')
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
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const dirty = JSON.stringify(params) !== JSON.stringify(saved)

  const update = useCallback((key: keyof DecayParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  async function handleSave() {
    if (!confirm(t('confirmChange'))) return
    setSaving(true)
    setMessage(null)
    try {
      await updateDecayParams(params)
      setSaved({ ...params })
      setMessage({ text: t('saveSuccess'), type: "ok" })
    } catch {
      setMessage({ text: t('saveError'), type: "err" })
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

  if (loading) return <div className="text-text-muted text-sm">{t('loading')}</div>

  return (
    <div className="space-y-5">
      {message && (
        <div className={`px-4 py-2 text-sm ${message.type === "ok" ? "bg-accent-secondary/10 text-accent-secondary" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {DECAY_PARAM_GROUPS.map(group => (
        <details key={group.group} open={group.group === "basic"} className="panel overflow-hidden">
          <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated/40">
            {tTypes(group.label)}
          </summary>
          <div className="space-y-4 px-5 pb-5 pt-2">
            {group.params.map(meta => (
              <ParamRow
                key={meta.key}
                meta={meta}
                value={params[meta.key]}
                onChange={v => update(meta.key, v)}
                label={tTypes(meta.label)}
              />
            ))}
          </div>
        </details>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary disabled:opacity-40">
          {saving ? t('saving') : t('save')}
        </button>
        {dirty && (
          <button onClick={handleRevert} className="btn-secondary">{t('revert')}</button>
        )}
        <button onClick={handleReset} className="btn-secondary ml-auto">{t('resetDefaults')}</button>
        {dirty && (
          <span className="bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
            {t('changed')}
          </span>
        )}
      </div>
    </div>
  )
}

function ParamRow({ meta, value, onChange, label }: { meta: DecayParamMeta; value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary font-medium">{label}</label>
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
          className="w-20 border-2 border-border bg-bg-surface rounded px-2 py-1 text-right font-mono text-xs text-text-primary focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent h-1.5 rounded-full"
      />
    </div>
  )
}
