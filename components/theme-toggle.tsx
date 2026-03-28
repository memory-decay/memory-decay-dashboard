"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="h-[44px] w-[44px] border-[3px] border-border bg-bg-elevated shadow-sm" />
    )
  }

  const modes = ["dark", "light", "system"] as const
  const icons: Record<string, typeof Moon> = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  }
  const titles: Record<string, string> = {
    dark: "Dark mode",
    light: "Light mode",
    system: "System",
  }

  const cycle = () => {
    const idx = modes.indexOf(theme as typeof modes[number])
    setTheme(modes[(idx + 1) % modes.length])
  }

  const Icon = icons[theme ?? "dark"]

  return (
    <button
      onClick={cycle}
      className="flex h-[44px] w-[44px] items-center justify-center border-[3px] border-border-strong bg-bg-elevated text-text-secondary shadow-sm transition-none hover:bg-accent/10 hover:text-accent hover:shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none"
      title={titles[theme ?? "dark"]}
      aria-label={`Theme: ${titles[theme ?? "dark"]}`}
    >
      <Icon
        size={20}
        strokeWidth={2}
        className="shrink-0"
      />
    </button>
  )
}
