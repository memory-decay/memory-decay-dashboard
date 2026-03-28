# Add Light Mode Theme Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light mode theme alongside the existing dark mode, with a toggle in the sidebar, defaulting to system preference.

**Architecture:** Use `next-themes` for theme state management with CSS variables for color tokens. Dark mode colors stay as-is; light mode colors are defined under `[data-theme="light"]`. CSS variables use RGB triplet format (`124, 156, 255`) so Tailwind opacity modifiers (`bg-accent/20`) work correctly. Chart components read colors from a shared theme-aware hook so hardcoded hex values are eliminated.

**Tech Stack:** next-themes, Tailwind CSS 3 (class strategy), CSS custom properties (RGB triplet format)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/theme-colors.ts` | Create | Theme color constants & `useChartColors` hook |
| `components/theme-toggle.tsx` | Create | Light/dark/system toggle button |
| `components/theme-provider.tsx` | Create | Wraps `next-themes` ThemeProvider |
| `app/globals.css` | Modify | Add `[data-theme="light"]` variables, update body styles |
| `tailwind.config.ts` | Modify | Switch colors to CSS variable references, add `darkMode: "class"` |
| `app/layout.tsx` | Modify | Wrap with ThemeProvider, add `suppressHydrationWarning` |
| `components/sidebar.tsx` | Modify | Add ThemeToggle component |
| `lib/types.ts` | Modify | Remove `CHART_TOOLTIP_STYLE` (moved to theme-colors) |
| `components/decay-chart.tsx` | Modify | Replace hardcoded hex with theme hook |
| `components/association-graph.tsx` | Modify | Replace hardcoded hex with theme hook |
| `app/[locale]/analytics/page.tsx` | Modify | Replace hardcoded hex with theme hook |
| `app/[locale]/memory/[id]/page.tsx` | Modify | Replace hardcoded hex with theme hook |

---

## Chunk 1: Theme Infrastructure

### Task 1: Install next-themes

- [ ] **Step 1: Install the package**

```bash
npm install next-themes
```

- [ ] **Step 2: Verify installation**

```bash
grep next-themes package.json
```

Expected: `"next-themes": "^0.x.x"` in dependencies

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add next-themes dependency for light/dark mode support"
```

---

### Task 2: Define light mode CSS variables

**Files:**
- Modify: `app/globals.css`

The existing `:root` block defines dark mode colors. We need to:
1. Keep `:root` as the dark default
2. Add a `[data-theme="light"]` block with light mode colors
3. Make the body background theme-aware

- [ ] **Step 1: Replace `:root` block with RGB triplet format**

CSS variables must use RGB triplets (not hex) so Tailwind opacity modifiers like `bg-accent/20` work. Replace the entire `:root { ... }` block (lines 5-18) with:

```css
:root {
  --bg-primary: 11, 11, 14;
  --bg-surface: 21, 24, 33;
  --bg-elevated: 29, 34, 48;
  --bg-glow: 16, 22, 35;
  --accent: 124, 156, 255;
  --accent-secondary: 73, 220, 177;
  --accent-warm: 245, 166, 91;
  --text-primary: 248, 250, 252;
  --text-secondary: 170, 182, 207;
  --text-muted: 112, 128, 156;
  --border: 38, 48, 66;
  --border-strong: 51, 65, 90;
  --status-danger: 248, 113, 113;
  --status-caution: 251, 191, 36;
  --status-stable: 52, 211, 153;
  --shadow-panel: 0 12px 40px rgba(0, 0, 0, 0.28);
}
```

- [ ] **Step 2: Add light theme variables after `:root`**

```css
[data-theme="light"] {
  --bg-primary: 248, 249, 251;
  --bg-surface: 255, 255, 255;
  --bg-elevated: 240, 242, 245;
  --bg-glow: 238, 241, 248;
  --accent: 74, 108, 247;
  --accent-secondary: 22, 166, 122;
  --accent-warm: 212, 135, 46;
  --text-primary: 26, 29, 36;
  --text-secondary: 74, 85, 104;
  --text-muted: 136, 150, 171;
  --border: 226, 230, 237;
  --border-strong: 203, 210, 220;
  --status-danger: 220, 38, 38;
  --status-caution: 217, 119, 6;
  --status-stable: 22, 163, 74;
  --shadow-panel: 0 4px 24px rgba(0, 0, 0, 0.06);
}
```

- [ ] **Step 3: Make body background theme-aware**

Replace the `html, body` background rule (lines 24-34) with:

Since CSS variables now store RGB triplets, all `var(--xxx)` usages in this file must be wrapped with `rgb()`. Replace the `html, body` rule with:

```css
html,
body {
  min-height: 100%;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  font-family: "DM Sans", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

html:not([data-theme="light"]) body {
  background:
    radial-gradient(circle at top left, rgba(124, 156, 255, 0.12), transparent 25%),
    radial-gradient(circle at top right, rgba(73, 220, 177, 0.08), transparent 20%),
    linear-gradient(180deg, #090b10 0%, #0b0b0e 45%, #0c1018 100%);
}

html[data-theme="light"] body {
  background:
    radial-gradient(circle at top left, rgba(74, 108, 247, 0.06), transparent 25%),
    radial-gradient(circle at top right, rgba(22, 166, 122, 0.04), transparent 20%),
    linear-gradient(180deg, #f8f9fb 0%, #ffffff 45%, #f0f2f5 100%);
}
```

Note: `data-theme` is set on `<html>` by next-themes, so selectors use `html[data-theme="light"]` (attribute on html), not `[data-theme="light"] html` (descendant of data-theme element).

- [ ] **Step 4: Update selection color for light mode**

After the existing `::selection` rule, add:

Also update the existing `::selection` rule to use `rgb()`:

```css
::selection {
  background: rgba(var(--accent), 0.3);
  color: rgb(var(--text-primary));
}
```

This single rule works for both themes since it references the CSS variables.

- [ ] **Step 5: Update component layer classes that use hardcoded shadows**

In the `.panel-glow` class, make it theme-aware:

```css
  .panel-glow {
    box-shadow: var(--shadow-panel);
  }
```

And in `.chart-section`, update the background-image for light mode by adding after the `.chart-section` rule:

```css
  html[data-theme="light"] .chart-section {
    background-image:
      linear-gradient(rgba(var(--accent), 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--accent), 0.04) 1px, transparent 1px);
  }
```

**Important:** Since all CSS variables are now RGB triplets, every `var(--xxx)` usage in `globals.css` for color values must be wrapped in `rgb()` or `rgba()`. Go through all `@layer components` classes and update any `@apply` directives that reference these colors — Tailwind handles this automatically when configured with `<alpha-value>` (see Task 3), but any raw `var()` usage in custom CSS needs the `rgb()` wrapper.

- [ ] **Step 6: Verify the CSS is valid**

```bash
npx tailwindcss --input app/globals.css --output /dev/null 2>&1 | head -5
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "Define light mode CSS variables and theme-aware body styles"
```

---

### Task 3: Switch Tailwind config to CSS variables

**Files:**
- Modify: `tailwind.config.ts`

Replace hardcoded hex colors with `var(--...)` references so Tailwind classes automatically respond to theme changes.

- [ ] **Step 1: Update tailwind.config.ts**

Replace the entire file with:

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          glow: "rgb(var(--bg-glow) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
          warm: "rgb(var(--accent-warm) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        status: {
          danger: "rgb(var(--status-danger) / <alpha-value>)",
          caution: "rgb(var(--status-caution) / <alpha-value>)",
          stable: "rgb(var(--status-stable) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
      },
    },
  },
  plugins: [],
}

export default config
```

The `<alpha-value>` placeholder is how Tailwind v3.1+ supports opacity modifiers with CSS variables. When you write `bg-accent/20`, Tailwind generates `rgb(var(--accent) / 0.2)`. This requires CSS variables to store RGB triplets (which we set up in Task 2).

The `darkMode: ["class", '[data-theme="dark"]']` array form requires Tailwind v3.3+. The project uses v3.4.17 so this is safe.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "Switch Tailwind color config from hex to CSS variables"
```

---

### Task 4: Create ThemeProvider component

**Files:**
- Create: `components/theme-provider.tsx`

- [ ] **Step 1: Create the provider**

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 2: Wire ThemeProvider into root layout**

Modify `app/layout.tsx` to wrap children:

```tsx
import './globals.css';
import ThemeProvider from '@/components/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` is required because `next-themes` injects a script that sets `data-theme` before React hydrates, which would cause a mismatch warning without it.

- [ ] **Step 3: Run dev server briefly to verify no crash**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/theme-provider.tsx app/layout.tsx
git commit -m "Add ThemeProvider wrapping root layout with next-themes"
```

---

### Task 5: Create ThemeToggle component

**Files:**
- Create: `components/theme-toggle.tsx`

- [ ] **Step 1: Create the toggle**

```tsx
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg" />
  }

  const modes = ["dark", "light", "system"] as const
  const labels: Record<string, string> = { dark: "●", light: "○", system: "◐" }
  const titles: Record<string, string> = { dark: "Dark mode", light: "Light mode", system: "System" }

  const cycle = () => {
    const idx = modes.indexOf(theme as typeof modes[number])
    setTheme(modes[(idx + 1) % modes.length])
  }

  return (
    <button
      onClick={cycle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
      title={titles[theme ?? "dark"]}
      aria-label={`Theme: ${titles[theme ?? "dark"]}`}
    >
      <span className="text-sm">{labels[theme ?? "dark"]}</span>
    </button>
  )
}
```

- [ ] **Step 2: Add ThemeToggle to the sidebar**

Modify `components/sidebar.tsx`. The current logo header (line 24) is:

```tsx
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
```

Change it to `justify-between` and nest the existing logo content inside a flex container, then add `<ThemeToggle />`:

```tsx
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent text-sm font-bold">
            M
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Memory Decay</div>
            <div className="text-[10px] text-text-muted">{t('sidebar.subtitle')}</div>
          </div>
        </div>
        <ThemeToggle />
      </div>
```

The key change: the outer div switches from `gap-2` to `justify-between`, the logo+text is wrapped in a new inner `<div className="flex items-center gap-2">`, and `<ThemeToggle />` is added as a sibling.

Add the import at the top of sidebar.tsx:

```tsx
import ThemeToggle from "./theme-toggle"
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/theme-toggle.tsx components/sidebar.tsx
git commit -m "Add theme toggle to sidebar for light/dark/system switching"
```

---

## Chunk 2: Chart Color Migration

### Task 6: Create theme-aware chart color hook

**Files:**
- Create: `lib/theme-colors.ts`
- Modify: `lib/types.ts` (remove `CHART_TOOLTIP_STYLE`)

The problem: Recharts and d3 accept inline style objects and string props for colors. CSS variables work in inline styles (`var(--accent)`) but we need a central place for chart colors.

- [ ] **Step 1: Create lib/theme-colors.ts**

Note: No `"use client"` directive on this file. The hook `useChartColors` can only be called from client components (which all chart components already are), and the pure utility functions (`getChartTooltipStyle`, `getScoreColor`, `withAlpha`) remain importable from server components if ever needed.

```ts
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
```

- [ ] **Step 2: Remove CHART_TOOLTIP_STYLE from lib/types.ts**

Delete lines 127-133 from `lib/types.ts`:

```ts
// DELETE THIS:
export const CHART_TOOLTIP_STYLE = {
  background: "#151821",
  border: "1px solid #263042",
  borderRadius: 8,
  fontSize: 12,
  color: "#f8fafc",
}
```

- [ ] **Step 3: Run typecheck to find all CHART_TOOLTIP_STYLE usages**

```bash
npm run typecheck 2>&1 | head -20
```

Expected: Errors pointing to files that import CHART_TOOLTIP_STYLE — we'll fix these in the next tasks.

- [ ] **Step 4: Commit**

```bash
git add lib/theme-colors.ts lib/types.ts
git commit -m "Add useChartColors hook and remove hardcoded CHART_TOOLTIP_STYLE"
```

---

### Task 7: Migrate decay-chart.tsx to theme-aware colors

**Files:**
- Modify: `components/decay-chart.tsx`

- [ ] **Step 1: Read the current file**

```bash
# Read decay-chart.tsx to understand full structure before editing
```

- [ ] **Step 2: Update imports**

Replace any import of `CHART_TOOLTIP_STYLE` from `@/lib/types` with:

```tsx
import { useChartColors, getChartTooltipStyle } from "@/lib/theme-colors"
```

- [ ] **Step 3: Add hook call at top of component**

Inside the component function, add:

```tsx
const colors = useChartColors()
```

- [ ] **Step 4: Replace all hardcoded hex values**

Replace **every** hardcoded color with the corresponding `colors.xxx` value. Full list for this file:

| Location | Hardcoded | Replace with |
|----------|-----------|-------------|
| `<stop>` stopColor (×2 in `<linearGradient>`) | `"#7c9cff"` | `colors.accent` |
| `<CartesianGrid>` stroke | `"#263042"` | `colors.gridLine` |
| `<XAxis>` stroke | `"#70809c"` | `colors.textMuted` |
| `<XAxis>` label `style: { fill: "#70809c" }` | `"#70809c"` | `colors.textMuted` |
| `<YAxis>` stroke | `"#70809c"` | `colors.textMuted` |
| `<Tooltip>` contentStyle (inline object) | multiple hex | `getChartTooltipStyle(colors)` |
| `<ReferenceLine>` stroke + label fill | `"#f87171"` | `colors.danger` |
| `<Area>` stroke | `"#7c9cff"` | `colors.accent` |

For the tooltip `contentStyle`, replace the entire inline object with:

```tsx
contentStyle={getChartTooltipStyle(colors)}
```

For the XAxis label prop, update the style object:

```tsx
label={{ value: "틱", position: "insideBottomRight", offset: -5, style: { fill: colors.textMuted, fontSize: 10 } }}
```

- [ ] **Step 5: Verify build**

```bash
npm run typecheck
```

Expected: No errors in decay-chart.tsx

- [ ] **Step 6: Commit**

```bash
git add components/decay-chart.tsx
git commit -m "Migrate decay-chart colors to theme-aware hook"
```

---

### Task 8: Migrate association-graph.tsx to theme-aware colors

**Files:**
- Modify: `components/association-graph.tsx`

This file uses d3 which sets colors via `.attr("fill", ...)` and `.attr("stroke", ...)`. Since d3 runs in `useEffect`, it can read theme colors passed as a dependency.

- [ ] **Step 1: Read the current file**

Read `components/association-graph.tsx` fully before editing.

- [ ] **Step 2: Add imports and hook**

```tsx
import { useChartColors, getScoreColor } from "@/lib/theme-colors"
```

Inside component:

```tsx
const colors = useChartColors()
```

- [ ] **Step 3: Replace the local `scoreColor` function**

Delete the standalone function (lines 28-32):

```tsx
function scoreColor(score: number): string {
  if (score >= 0.7) return "#49dcb1"
  if (score >= 0.4) return "#f5a65b"
  return "#f87171"
}
```

Then replace all call sites of `scoreColor(score)` with `getScoreColor(score, colors)` (using the import from `@/lib/theme-colors`).

- [ ] **Step 4: Replace hardcoded hex in d3 code**

| Hardcoded | Replace with |
|-----------|-------------|
| `"#263042"` (link stroke) | `colors.border` |
| `"#94a3b8"` (text fill) | `colors.textMuted` |
| `"#7c9cff"` (search highlight) | `colors.accent` |

- [ ] **Step 5: Add `colors` to the d3 useEffect dependency array**

So the graph re-renders when theme changes.

- [ ] **Step 6: Update legend badge colors in JSX**

Replace:
```tsx
<span className="... bg-[#49dcb1]" />
<span className="... bg-[#f5a65b]" />
<span className="... bg-[#f87171]" />
```

With:
```tsx
<span className="... bg-accent-secondary" />
<span className="... bg-accent-warm" />
<span className="... bg-status-danger" />
```

(These use Tailwind classes that now reference CSS variables.)

- [ ] **Step 7: Verify build**

```bash
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add components/association-graph.tsx
git commit -m "Migrate association-graph colors to theme-aware hook"
```

---

### Task 9: Migrate analytics page chart colors

**Files:**
- Modify: `app/[locale]/analytics/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/[locale]/analytics/page.tsx` fully.

- [ ] **Step 2: Add imports and hook**

```tsx
import { useChartColors, getChartTooltipStyle } from "@/lib/theme-colors"
```

Add inside component:

```tsx
const colors = useChartColors()
```

**Note:** This page component might be a server component. If so, you need to convert it to a client component by adding `"use client"` at the top, or extract the chart sections into a client component. Check the current file — if it already has `"use client"`, just add the hook. If it doesn't, add `"use client"` at the top.

- [ ] **Step 3: Replace PIE_COLORS constant**

```tsx
// Replace:
const PIE_COLORS = ["#7c9cff", "#49dcb1", "#f5a65b", "#f87171"]

// With (inside component, after hook):
const PIE_COLORS = [colors.accent, colors.accentSecondary, colors.accentWarm, colors.danger]
```

- [ ] **Step 4: Replace all hardcoded hex in chart props**

Apply the same mapping as Task 7 Step 4 to all `<CartesianGrid>`, `<XAxis>`, `<YAxis>`, `<Line>`, `<Bar>`, `<Area>`, `<Tooltip>`, `<Legend>` props.

**Special case — 8-digit hex with alpha:** Line ~97 has `fill="#f8717120"` (danger color at ~12% opacity). This is an 8-digit hex (RRGGBBAA). Replace with a template literal:

```tsx
fill={`rgba(${colors.danger.slice(1).match(/../g)!.map(h => parseInt(h, 16)).join(', ')}, 0.12)`}
```

Or more readably, add a helper to `lib/theme-colors.ts`:

```ts
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
```

Then use: `fill={withAlpha(colors.danger, 0.12)}`

Also update `<Legend wrapperStyle>` instances: `{ fontSize: 11, color: "#70809c" }` → `{ fontSize: 11, color: colors.textMuted }`

- [ ] **Step 5: Verify build**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/analytics/page.tsx lib/theme-colors.ts
git commit -m "Migrate analytics page chart colors to theme-aware hook"
```

---

### Task 10: Migrate memory detail page chart colors

**Files:**
- Modify: `app/[locale]/memory/[id]/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/[locale]/memory/[id]/page.tsx` fully.

- [ ] **Step 2: Update imports and add hook**

Replace any import of `CHART_TOOLTIP_STYLE` from `@/lib/types` with:

```tsx
import { useChartColors, getChartTooltipStyle } from "@/lib/theme-colors"
```

Add inside component:

```tsx
const colors = useChartColors()
```

**Note:** If this is a server component (no `"use client"` at top), add `"use client"` since `useChartColors` is a React hook.

- [ ] **Step 3: Replace all hardcoded hex in chart props**

Same mapping as Task 7. Replace all `CHART_TOOLTIP_STYLE` usages with `getChartTooltipStyle(colors)`. Special attention to the custom dot renderer (line ~169-172) which uses `"#f87171"` and `"#7c9cff"` — replace with `colors.danger` and `colors.accent`. Also update `<Legend wrapperStyle>` color values to `colors.textMuted`.

- [ ] **Step 4: Verify build**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/memory/[id]/page.tsx
git commit -m "Migrate memory detail page chart colors to theme-aware hook"
```

---

## Chunk 3: Final Polish

### Task 11: Verify opacity modifiers work

Since we used RGB triplets in CSS variables from the start (Task 2) and `<alpha-value>` in Tailwind config (Task 3), opacity modifiers should already work. This task is a verification step.

- [ ] **Step 1: Build and verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 2: Spot-check opacity classes**

Search for opacity modifier usage to know what to visually verify:

```bash
grep -rn '/[0-9]\+' app/globals.css components/sidebar.tsx | head -20
```

Key classes to verify visually: `bg-accent/20` (buttons), `bg-bg-surface/90` (panel), `bg-bg-primary/60` (stat-card), `bg-accent/15` (active nav item). These should render as semi-transparent in both light and dark modes.

- [ ] **Step 3: Commit (only if fixes needed)**

```bash
git add -A
git commit -m "Fix opacity modifier issues in theme implementation"
```

---

### Task 12: Visual verification

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify dark mode (default)**

Open http://localhost:3000. Everything should look identical to before — dark theme with blue/teal accents.

Check:
- Sidebar renders correctly
- Dashboard page renders
- Charts render with correct colors
- Navigate to analytics, memory detail, graph pages

- [ ] **Step 3: Toggle to light mode**

Click the theme toggle in the sidebar (should show ○). Verify:
- Background switches to light
- Text is dark on light backgrounds
- Sidebar has light background
- Charts have appropriate light-theme colors
- Borders are visible but subtle
- No white-on-white or dark-on-dark text

- [ ] **Step 4: Toggle to system mode**

Click again (should show ◐). Verify it follows OS preference.

- [ ] **Step 5: Refresh page**

Theme choice should persist across page refresh (next-themes stores in localStorage).

- [ ] **Step 6: Fix any visual issues found**

Common issues:
- Missing color variable → element inherits wrong color
- Opacity modifier broken → semi-transparent backgrounds show wrong
- Chart tooltip unreadable → tooltip style not using theme colors
- d3 graph doesn't update → missing `colors` in useEffect deps

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "Fix visual issues from light mode theme implementation"
```

(Only if there were fixes needed.)

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Install next-themes | 2 min |
| 2 | Define light mode CSS variables | 5 min |
| 3 | Switch Tailwind to CSS variables | 3 min |
| 4 | Create ThemeProvider | 3 min |
| 5 | Create ThemeToggle + wire to sidebar | 4 min |
| 6 | Create useChartColors hook | 4 min |
| 7 | Migrate decay-chart.tsx | 4 min |
| 8 | Migrate association-graph.tsx | 5 min |
| 9 | Migrate analytics page | 4 min |
| 10 | Migrate memory detail page | 4 min |
| 11 | Verify opacity modifiers work | 3 min |
| 12 | Visual verification | 5 min |
