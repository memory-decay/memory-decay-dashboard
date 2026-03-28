import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Neo-Brutalist Color Palette — Maximum Vibrancy, Maximum Contrast
 *
 * Principles:
 * - Electric, saturated colors (no muted pastels)
 * - WCAG 4.5:1 contrast minimum for all text/background pairs
 * - Bold yellows, hot pinks, electric blues
 * - Stark black/white contrasts
 * - Status colors that demand attention
 *
 * Cloudflare-Inspired Additions:
 * - Multiple accent tiers (brand orange, sky blue, indigo)
 * - Semantic color scales (success, warning, error, info with variants)
 * - Surface elevation levels (surface-1, surface-2, surface-3)
 */

// ============================================
// CORE ACCENT COLORS — Neon Neo-Brutalist (Dark)
// ============================================

const ACCENT_COLORS = {
  // Primary accents — neon and vivid on dark backgrounds
  accent: "#00F5FF",              // Electric cyan
  accentSecondary: "#A78BFA",     // Soft electric purple
  accentWarm: "#FF1493",          // Deep hot pink
  accentYellow: "#FACC15",        // Neon yellow
  accentOrange: "#FF6B35",        // Electric orange

  // Additional neon accents
  brandOrange: "#FF8A00",         // Bright orange
  skyBlue: "#38BDF8",             // Sky blue
  indigo: "#818CF8",              // Indigo
  violet: "#A78BFA",              // Bright violet
  fuchsia: "#E879F9",             // Bright fuchsia
  emerald: "#34D399",             // Neon green
  rose: "#FB7185",                // Neon rose
  amber: "#FBBF24",               // Neon amber
} as const

// ============================================
// SEMANTIC COLOR SCALES
// ============================================

const SEMANTIC_DARK = {
  // Success scale
  success: "#00FF66",
  successLight: "#86EFAC",
  successDark: "#16A34A",
  successBg: "#052E16",
  successBorder: "#22C55E",

  // Warning scale
  warning: "#FFAA00",
  warningLight: "#FCD34D",
  warningDark: "#D97706",
  warningBg: "#451A03",
  warningBorder: "#F59E0B",

  // Error scale
  error: "#FF0040",
  errorLight: "#FCA5A5",
  errorDark: "#DC2626",
  errorBg: "#450A0A",
  errorBorder: "#EF4444",

  // Info scale
  info: "#00CCFF",
  infoLight: "#7DD3FC",
  infoDark: "#0284C7",
  infoBg: "#082F49",
  infoBorder: "#38BDF8",
} as const

const SEMANTIC_LIGHT = {
  success: "#16A34A",
  successLight: "#86EFAC",
  successDark: "#14532D",
  successBg: "#F0FDF4",
  successBorder: "#86EFAC",

  warning: "#D97706",
  warningLight: "#FCD34D",
  warningDark: "#78350F",
  warningBg: "#FFFBEB",
  warningBorder: "#FCD34D",

  error: "#DC2626",
  errorLight: "#FCA5A5",
  errorDark: "#7F1D1D",
  errorBg: "#FEF2F2",
  errorBorder: "#FCA5A5",

  info: "#0284C7",
  infoLight: "#7DD3FC",
  infoDark: "#0C4A6E",
  infoBg: "#F0F9FF",
  infoBorder: "#7DD3FC",
} as const

// ============================================
// DARK MODE — Full Color System
// ============================================

const DARK_COLORS = {
  ...ACCENT_COLORS,
  ...SEMANTIC_DARK,

  // Legacy status color mappings
  danger: "#FF0040",
  caution: "#FFAA00",
  stable: "#00FF66",

  // Surface colors — purple/blue tinted darks
  surface: "#080810",
  surface1: "#080810",
  surface2: "#0E0E1A",
  surface3: "#161222",
  surface4: "#1E1C2A",
  surface5: "#262432",
  surfaceElevated: "#14121E",
  elevated: "#14121E",
  glow: "#282632",
  hover: "#231E32",
  active: "#322D46",
  pressed: "#413C55",

  // Border colors — purple tinted
  border: "#3C3A4B",
  subtle: "#282637",
  strong: "#787396",
  gridLine: "#282637",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#E0E0E0",
  textMuted: "#A0A0A0",
  disabled: "#737373",
  placeholder: "#525252",
  inverse: "#080810",
} as const

// ============================================
// LIGHT MODE — Adapted Color System
// ============================================

const LIGHT_COLORS = {
  // Accents — vivid on warm cream backgrounds
  accent: "#0891B2",
  accentSecondary: "#7C3AED",
  accentWarm: "#DB2777",
  accentYellow: "#CA8A04",
  accentOrange: "#EA580C",
  brandOrange: "#F48120",
  skyBlue: "#0284C7",
  indigo: "#4F46E5",
  violet: "#7C3AED",
  fuchsia: "#C026D3",
  emerald: "#059669",
  rose: "#E11D48",
  amber: "#B45309",

  ...SEMANTIC_LIGHT,

  // Legacy status color mappings
  danger: "#DC2626",
  caution: "#D97706",
  stable: "#16A34A",

  // Surface colors — warm yellow-tinted
  surface: "#FFFBEB",
  surface1: "#FFFBEB",
  surface2: "#FFF9DB",
  surface3: "#FEF3C7",
  surface4: "#FDE68A",
  surface5: "#F9D34D",
  surfaceElevated: "#FFFFFF",
  elevated: "#FFFFFF",
  glow: "#F5F0DC",
  hover: "#FEF9C3",
  active: "#FDE68A",
  pressed: "#FBD34D",

  // Border colors — warm dark
  border: "#1C1917",
  subtle: "#D6D3D1",
  strong: "#1C1917",
  gridLine: "#E7E5E4",

  // Text colors — warm dark
  textPrimary: "#1C1917",
  textSecondary: "#292524",
  textMuted: "#57534E",
  disabled: "#A3A3A3",
  placeholder: "#A8A29E",
  inverse: "#FFFFFF",
} as const

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ChartColors = typeof DARK_COLORS
export type LightColors = typeof LIGHT_COLORS
export type ThemeColors = ChartColors | LightColors

// ============================================
// HOOKS
// ============================================

/**
 * Hook to get theme-aware chart colors
 */
export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState<ChartColors>(DARK_COLORS)

  useEffect(() => {
    setColors((resolvedTheme === "light" ? LIGHT_COLORS : DARK_COLORS) as ChartColors)
  }, [resolvedTheme])

  return colors
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get chart tooltip style based on current colors
 */
export function getChartTooltipStyle(colors: ChartColors) {
  return {
    background: colors.surface,
    border: `2px solid ${colors.border}`,
    borderRadius: 0,
    fontSize: 12,
    fontWeight: 600,
    color: colors.textPrimary,
    boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.9)",
  }
}

/**
 * Get color based on score value
 * 0.7+ = electric green (stable)
 * 0.4-0.7 = hot pink (caution)
 * <0.4 = vivid red (danger)
 */
export function getScoreColor(score: number, colors: ChartColors): string {
  if (score >= 0.7) return colors.stable
  if (score >= 0.4) return colors.accentWarm
  return colors.danger
}

/**
 * Get color for memory decay visualization
 * Returns a gradient of colors based on decay level
 */
export function getDecayColor(decay: number): string {
  if (decay >= 0.8) return "#FF0040"      // Critical — vivid red
  if (decay >= 0.6) return "#FF1493"      // High — hot pink
  if (decay >= 0.4) return "#FFAA00"      // Medium — amber
  if (decay >= 0.2) return "#FFFF00"      // Low — yellow
  return "#00FF66"                         // Fresh — electric green
}

/**
 * Apply alpha transparency to a hex color
 */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Chart color palette for data visualization
 * Ordered for maximum visual distinction
 */
export function getChartPalette(colors: ChartColors): string[] {
  return [
    colors.accent,           // Electric cyan
    colors.accentWarm,       // Hot pink
    colors.accentYellow,     // Yellow
    colors.stable,           // Electric green
    colors.accentOrange,     // Orange
    colors.accentSecondary,  // Purple
    colors.danger,           // Red
    colors.caution,          // Amber
  ]
}

// ============================================
// CONTRAST UTILITIES
// ============================================

/**
 * Calculate relative luminance of a color (for contrast calculations)
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(hex: string): number {
  const rgb = hex.slice(1).match(/.{2}/g)?.map(x => {
    const v = parseInt(x, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }) || [0, 0, 0]
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio (1-21), where 4.5 is WCAG AA minimum for normal text
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1)
  const lum2 = getLuminance(hex2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Verify that a color combination meets WCAG contrast requirements
 */
export function verifyContrast(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA"
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background)
  const required = level === "AAA" ? 7 : 4.5
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  }
}

/**
 * Verify all theme color combinations meet WCAG requirements
 */
export function verifyThemeContrast(isDark: boolean = true): Record<string, { passes: boolean; ratio: number }> {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  const bg = isDark ? "#0A0A0A" : "#FFFFFF"

  return {
    textPrimary: { passes: verifyContrast(colors.textPrimary, bg).passes, ratio: getContrastRatio(colors.textPrimary, bg) },
    textSecondary: { passes: verifyContrast(colors.textSecondary, bg).passes, ratio: getContrastRatio(colors.textSecondary, bg) },
    textMuted: { passes: verifyContrast(colors.textMuted, bg).passes, ratio: getContrastRatio(colors.textMuted, bg) },
    accent: { passes: verifyContrast(colors.accent, bg).passes, ratio: getContrastRatio(colors.accent, bg) },
    accentSecondary: { passes: verifyContrast(colors.accentSecondary, bg).passes, ratio: getContrastRatio(colors.accentSecondary, bg) },
    accentWarm: { passes: verifyContrast(colors.accentWarm, bg).passes, ratio: getContrastRatio(colors.accentWarm, bg) },
    stable: { passes: verifyContrast(colors.stable, bg).passes, ratio: getContrastRatio(colors.stable, bg) },
    caution: { passes: verifyContrast(colors.caution, bg).passes, ratio: getContrastRatio(colors.caution, bg) },
    danger: { passes: verifyContrast(colors.danger, bg).passes, ratio: getContrastRatio(colors.danger, bg) },
    info: { passes: verifyContrast(colors.info, bg).passes, ratio: getContrastRatio(colors.info, bg) },
  }
}
