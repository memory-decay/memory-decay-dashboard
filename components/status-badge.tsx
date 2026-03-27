"use client"

import { FreshnessStatus, getFreshnessLabel } from "@/lib/types"
import { useTranslations } from "next-intl"

interface StatusBadgeProps {
  status: FreshnessStatus
}

const STYLES: Record<FreshnessStatus, string> = {
  fresh: "bg-status-stable/15 text-status-stable border-status-stable/30",
  normal: "bg-status-caution/15 text-status-caution border-status-caution/30",
  stale: "bg-status-danger/15 text-status-danger border-status-danger/30",
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('types')
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
        status === "fresh" ? "bg-status-stable" :
        status === "normal" ? "bg-status-caution" :
        "bg-status-danger"
      }`} />
      {t(getFreshnessLabel(status))}
    </span>
  )
}
