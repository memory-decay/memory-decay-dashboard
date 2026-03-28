"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { getAllMemories } from "@/lib/api"
import { Memory } from "@/lib/types"

function GraphLoading() {
  const t = useTranslations('graph')
  return (
    <div className="flex items-center justify-center h-[500px] text-text-muted text-sm">
      {t('loading')}
    </div>
  )
}

const AssociationGraph = dynamic(() => import("@/components/association-graph"), {
  ssr: false,
  loading: GraphLoading,
})

export default function GraphPage() {
  const t = useTranslations('graph')
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
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('subtitle')}</p>
        {loading && <span className="text-xs text-text-muted ml-2">{t('loading')}</span>}
      </div>

      {!loading && <AssociationGraph memories={memories} />}
    </div>
  )
}
