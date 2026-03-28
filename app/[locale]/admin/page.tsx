"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { storeMemory, resetMemories, advanceTick, getTickInterval, updateTickInterval } from "@/lib/api"
import { StoreRequest } from "@/lib/types"
import ParamEditor from "@/components/param-editor"

export default function AdminPage() {
  const t = useTranslations('admin')
  const types = useTranslations('types.memoryType')
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
      setStatus(t('tickComplete', { count: tickCount, current: result.current_tick }))
    } catch {
      setStatus(t('connectionError'))
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!confirm(t('confirmReset'))) return
    setLoading(true)
    setStatus(null)
    try {
      const result = await resetMemories()
      setStatus(t('initComplete', { count: result.cleared }))
    } catch {
      setStatus(t('connectionError'))
    }
    setLoading(false)
  }

  async function handleStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newMemory.text.trim() || !newMemory.category.trim()) {
      setStatus(t('enterTextAndCategory'))
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const result = await storeMemory(newMemory)
      setStatus(`Memory saved: ${result.id} (tick ${result.tick})`)
      setNewMemory({ text: "", importance: 0.5, mtype: "fact", category: "" })
    } catch {
      setStatus(t('connectionError'))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('subtitle')}</p>
      </div>

      {/* Status message */}
      {status && (
        <div className="rounded border border-border bg-bg-elevated/80 px-4 py-3 text-sm text-text-secondary">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global controls */}
        <div className="panel p-5 space-y-5">
          <div className="label">{t('globalControl')}</div>

          {/* Force tick */}
          <div className="space-y-3">
            <div className="text-sm text-text-secondary">{t('forceTick')}</div>
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
                {t('tickProgress', { count: tickCount })}
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="space-y-3 border-t border-border pt-5">
            <div className="text-sm text-text-secondary">{t('memoryInit')}</div>
            <p className="text-xs text-text-muted">{t('memoryInitWarning')}</p>
            <button
              onClick={handleReset}
              disabled={loading}
              className="btn-danger disabled:opacity-50"
            >
              {t('resetAll')}
            </button>
          </div>
        </div>

        {/* Add new memory */}
        <div className="panel p-5">
          <div className="label mb-4">{t('addNew')}</div>
          <form onSubmit={handleStore} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-text-muted">{t('text')}</label>
              <textarea
                value={newMemory.text}
                onChange={(e) => setNewMemory(prev => ({ ...prev, text: e.target.value }))}
                placeholder={t('textPlaceholder')}
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">{t('type')}</label>
                <select
                  value={newMemory.mtype}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, mtype: e.target.value as StoreRequest["mtype"] }))}
                  className="input-field"
                >
                  <option value="fact">{types('fact')}</option>
                  <option value="episode">{types('episode')}</option>
                  <option value="decision">{types('decision')}</option>
                  <option value="preference">{types('preference')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">{t('category')}</label>
                <input
                  type="text"
                  value={newMemory.category}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('categoryPlaceholder')}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-muted">
                {t('importance')}: <span className="font-mono text-accent">{newMemory.importance.toFixed(2)}</span>
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
              {t('saveMemory')}
            </button>
          </form>
        </div>
      </div>

      {/* Tick interval */}
      <div className="panel p-5 space-y-4">
        <div className="label">{t('tickInterval')}</div>
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
          <span className="text-sm text-text-muted">{t('seconds')}</span>
          <button
            onClick={async () => {
              try {
                await updateTickInterval(tickInterval)
                setSavedInterval(tickInterval)
                setStatus(t('intervalSaved', { interval: tickInterval }))
              } catch {
                setStatus(t('intervalFailed'))
              }
            }}
            disabled={tickInterval === savedInterval}
            className="btn-primary disabled:opacity-40"
          >
            {t('save')}
          </button>
        </div>
        <p className="text-xs text-text-muted">
          {t('seconds')}: {savedInterval} ({t('seconds')})
        </p>
      </div>

      {/* Decay params editor */}
      <div className="panel p-5">
        <div className="label mb-4">{t('decayParams')}</div>
        <ParamEditor />
      </div>
    </div>
  )
}
