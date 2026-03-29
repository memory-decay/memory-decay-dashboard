interface ScoreDisplayProps {
  label: string
  value: number
  color?: string
}

export default function ScoreDisplay({ label, value, color = "accent" }: ScoreDisplayProps) {
  const percentage = Math.round(value * 100)
  
  // Use inline styles for colors to ensure they work in both light/dark modes
  const colorStyles: Record<string, { bar: string; text: string }> = {
    accent: { bar: "rgb(var(--accent))", text: "text-accent" },
    secondary: { bar: "rgb(var(--accent-secondary))", text: "text-accent-secondary" },
    warm: { bar: "rgb(var(--accent-warm))", text: "text-accent-warm" },
    danger: { bar: "rgb(var(--status-danger))", text: "text-status-danger" },
    stable: { bar: "rgb(var(--status-stable))", text: "text-status-stable" },
  }
  const c = colorStyles[color] || colorStyles.accent

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium">{label}</span>
        <span className={`font-mono text-sm font-semibold ${c.text}`}>{percentage}%</span>
      </div>
      <div className="h-2.5 bg-surface-2 border border-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: c.bar }}
        />
      </div>
    </div>
  )
}
