interface ScoreDisplayProps {
  label: string
  value: number
  color?: string
}

export default function ScoreDisplay({ label, value, color = "accent" }: ScoreDisplayProps) {
  const percentage = Math.round(value * 100)
  const colorClasses: Record<string, { bar: string; text: string }> = {
    accent: { bar: "bg-accent", text: "text-accent" },
    secondary: { bar: "bg-accent-secondary", text: "text-accent-secondary" },
    warm: { bar: "bg-accent-warm", text: "text-accent-warm" },
    danger: { bar: "bg-status-danger", text: "text-status-danger" },
    stable: { bar: "bg-status-stable", text: "text-status-stable" },
  }
  const c = colorClasses[color] || colorClasses.accent

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-text-muted">{label}</span>
        <span className={`font-mono text-sm font-bold ${c.text}`}>{percentage}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-primary/80">
        <div
          className={`h-full rounded-full ${c.bar} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
