"use client"

import { FreshnessStatus, getFreshnessLabel } from "@/lib/types"
import { useTranslations } from "next-intl"

type BadgeVariant = FreshnessStatus | "info" | "warning" | "success" | "neutral"

interface StatusBadgeProps {
  status: FreshnessStatus
  variant?: BadgeVariant
  size?: "sm" | "md" | "lg"
}

// Expanded color palette with semantic variants — stronger visibility
const STYLES: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  // Original freshness statuses
  fresh: {
    bg: "bg-status-stable/20",
    text: "text-status-stable",
    border: "border-status-stable",
    dot: "bg-status-stable",
  },
  normal: {
    bg: "bg-status-caution/20",
    text: "text-status-caution",
    border: "border-status-caution",
    dot: "bg-status-caution",
  },
  stale: {
    bg: "bg-status-danger/20",
    text: "text-status-danger",
    border: "border-status-danger",
    dot: "bg-status-danger",
  },
  // New semantic variants
  info: {
    bg: "bg-status-info/20",
    text: "text-status-info",
    border: "border-status-info",
    dot: "bg-status-info",
  },
  warning: {
    bg: "bg-accent-orange/20",
    text: "text-accent-orange",
    border: "border-accent-orange",
    dot: "bg-accent-orange",
  },
  success: {
    bg: "bg-status-stable/20",
    text: "text-status-stable",
    border: "border-status-stable",
    dot: "bg-status-stable",
  },
  neutral: {
    bg: "bg-bg-elevated",
    text: "text-text-secondary",
    border: "border-border",
    dot: "bg-text-muted",
  },
}

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-[11px] gap-1.5",
  lg: "px-3 py-1.5 text-xs gap-2",
}

const DOT_SIZES = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
}

export default function StatusBadge({ status, variant, size = "md" }: StatusBadgeProps) {
  const t = useTranslations('types')
  const style = STYLES[variant || status]
  const sizeClass = SIZE_STYLES[size]
  const dotSize = DOT_SIZES[size]

  return (
    <span className={`inline-flex items-center border-2 font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} ${sizeClass}`}>
      <span className={`inline-block ${dotSize} ${style.dot}`} />
      {t(getFreshnessLabel(status))}
    </span>
  )
}

// Standalone badge component for non-freshness statuses
interface BadgeProps {
  children: React.ReactNode
  variant?: Exclude<BadgeVariant, FreshnessStatus>
  size?: "sm" | "md" | "lg"
  dot?: boolean
}

export function Badge({ children, variant = "neutral", size = "md", dot = true }: BadgeProps) {
  const style = STYLES[variant]
  const sizeClass = SIZE_STYLES[size]
  const dotSize = DOT_SIZES[size]

  return (
    <span className={`inline-flex items-center border-2 font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} ${sizeClass}`}>
      {dot && <span className={`inline-block ${dotSize} ${style.dot} mr-1`} />}
      {children}
    </span>
  )
}
