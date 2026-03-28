import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const DARK_COLORS = {
  accent: "#7c9cff",
  accentSecondary: "#49dcb1",
  accentWarm: "#f5a65b",
  danger: "#f87171",
  textMuted: "#70809c",
  textPrimary: "#f8fafc",
  border: "#263042",
  surface: "#151821",
  gridLine: "#263042",
}

const LIGHT_COLORS = {
  accent: "#4a6cf7",
  accentSecondary: "#16a67a",
  accentWarm: "#d4872e",
  danger: "#dc2626",
  textMuted: "#8896ab",
  textPrimary: "#1a1d24",
  border: "#e2e6ed",
  surface: "#ffffff",
  gridLine: "#e2e6ed",
}

export type ChartColors = typeof DARK_COLORS

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState<ChartColors>(DARK_COLORS)

  useEffect(() => {
    setColors(resolvedTheme === "light" ? LIGHT_COLORS : DARK_COLORS)
  }, [resolvedTheme])

  return colors
}

export function getChartTooltipStyle(colors: ChartColors) {
  return {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 12,
    color: colors.textPrimary,
  }
}

export function getScoreColor(score: number, colors: ChartColors): string {
  if (score >= 0.7) return colors.accentSecondary
  if (score >= 0.4) return colors.accentWarm
  return colors.danger
}

export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
