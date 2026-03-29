"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('themeToggle')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-full rounded-xl bg-surface-2 border border-border animate-pulse" />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-border">
      {/* Light Mode Button */}
      <button
        onClick={() => setTheme("light")}
        className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg transition-all duration-200 ${
          !isDark
            ? 'bg-accent-yellow text-amber-950 font-semibold shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
        }`}
      >
        <Sun size={14} strokeWidth={2} />
        <span>{t('light')}</span>
      </button>

      {/* Dark Mode Button */}
      <button
        onClick={() => setTheme("dark")}
        className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg transition-all duration-200 ${
          isDark
            ? 'bg-accent text-white font-semibold shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
        }`}
      >
        <Moon size={14} strokeWidth={2} />
        <span>{t('dark')}</span>
      </button>
    </div>
  )
}
