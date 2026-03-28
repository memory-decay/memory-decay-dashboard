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
