"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "./language-switcher"

interface NavItem {
  href: string
  labelKey: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "sidebar.nav.dashboard", icon: "⊞" },
  { href: "/search", labelKey: "sidebar.nav.search", icon: "⊘" },
  { href: "/analytics", labelKey: "sidebar.nav.analytics", icon: "⊡" },
  { href: "/graph", labelKey: "sidebar.nav.graph", icon: "⊛" },
  { href: "/admin", labelKey: "sidebar.nav.admin", icon: "⊛" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-bg-surface/95 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent text-sm font-bold">
          M
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">Memory Decay</div>
          <div className="text-[10px] text-text-muted">{t('sidebar.subtitle')}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-text-secondary hover:bg-bg-elevated/80 hover:text-text-primary"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      {/* Language Switcher */}
      <div className="border-t border-border px-4 py-3">
        <LanguageSwitcher />
      </div>

      {/* Server status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-status-stable animate-pulse" />
          {t('sidebar.serverStatus')}
        </div>
        <div className="mt-1 font-mono text-[10px] text-text-muted">
          localhost:8100
        </div>
      </div>
    </aside>
  )
}
