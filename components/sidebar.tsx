"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { LayoutGrid, Search, BarChart3, GitGraph, Shield } from "lucide-react"
import LanguageSwitcher from "./language-switcher"
import ThemeToggle from "./theme-toggle"

// Navigation items with distinct accent colors for visual variety
const NAV_ITEMS = [
  { href: "", labelKey: "sidebar.nav.dashboard", icon: LayoutGrid, accent: "accent" as const },
  { href: "/search", labelKey: "sidebar.nav.search", icon: Search, accent: "accent-secondary" as const },
  { href: "/analytics", labelKey: "sidebar.nav.analytics", icon: BarChart3, accent: "accent-warm" as const },
  { href: "/graph", labelKey: "sidebar.nav.graph", icon: GitGraph, accent: "accent-yellow" as const },
  { href: "/admin", labelKey: "sidebar.nav.admin", icon: Shield, accent: "accent-orange" as const },
] as const

type AccentColor = typeof NAV_ITEMS[number]["accent"]

// Color mappings for active states
const ACCENT_STYLES: Record<AccentColor, {
  text: string
  bg: string
  border: string
  iconBg: string
}> = {
  accent: {
    text: "text-accent",
    bg: "bg-accent/15",
    border: "border-accent/50",
    iconBg: "bg-accent/20",
  },
  "accent-secondary": {
    text: "text-accent-secondary",
    bg: "bg-accent-secondary/15",
    border: "border-accent-secondary/50",
    iconBg: "bg-accent-secondary/20",
  },
  "accent-warm": {
    text: "text-accent-warm",
    bg: "bg-accent-warm/15",
    border: "border-accent-warm/50",
    iconBg: "bg-accent-warm/20",
  },
  "accent-yellow": {
    text: "text-accent-yellow",
    bg: "bg-accent-yellow/15",
    border: "border-accent-yellow/50",
    iconBg: "bg-accent-yellow/20",
  },
  "accent-orange": {
    text: "text-accent-orange",
    bg: "bg-accent-orange/15",
    border: "border-accent-orange/50",
    iconBg: "bg-accent-orange/20",
  },
}

export default function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r-2 border-border bg-bg-surface/80 backdrop-blur-md">
      {/* Logo — with colored background */}
      <div className="border-b-2 border-border px-4 py-4 bg-accent/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-accent text-sm font-bold text-text-inverse rounded-md border border-accent shadow-sm">
              M
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary tracking-tight">Memory Decay</div>
              <div className="text-[10px] font-medium text-accent tracking-wide">{t('sidebar.subtitle')}</div>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const href = `/${locale}${item.href}`
          const isActive = item.href === "" ? pathname === `/${locale}` : pathname.startsWith(`/${locale}${item.href}`)
          const Icon = item.icon
          const accentStyle = ACCENT_STYLES[item.accent]

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 border-2 rounded-lg group ${
                isActive
                  ? `${accentStyle.bg} ${accentStyle.text} font-semibold ${accentStyle.border} shadow-sm`
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary border-transparent hover:border-border/60"
              }`}
            >
              <span className={`nav-icon-shell ${
                isActive ? `${accentStyle.iconBg} ${accentStyle.border}` : "group-hover:bg-bg-glow group-hover:border-border"
              }`}>
                <Icon
                  size={20}
                  strokeWidth={2.5}
                  className={isActive ? accentStyle.text : "text-current"}
                />
              </span>
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Language Switcher */}
      <div className="border-t-2 border-border px-4 py-3">
        <LanguageSwitcher />
      </div>

      {/* Server status */}
      <div className="border-t-2 border-border px-4 py-3 bg-status-stable/5">
        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-status-stable animate-pulse" />
          {t('sidebar.serverStatus')}
        </div>
        <div className="mt-1 font-mono text-[10px] text-accent">
          localhost:8100
        </div>
      </div>
    </aside>
  )
}
