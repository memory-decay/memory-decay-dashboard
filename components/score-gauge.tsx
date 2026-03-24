type ScoreGaugeProps = {
  value: number
  label: string
  color: string
  glowColor: string
}

const RADIUS = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreGauge({ value, label, color, glowColor }: ScoreGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), 1)
  const dashArray = clamped * CIRCUMFERENCE
  const dashGap = CIRCUMFERENCE - dashArray

  return (
    <div className="gauge-card">
      <p className="label">{label}</p>
      <div className="relative mx-auto mt-2 h-[72px] w-[72px]">
        <svg viewBox="0 0 72 72" className="h-full w-full">
          <circle
            cx={36}
            cy={36}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-border"
          />
          <circle
            cx={36}
            cy={36}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={`${dashArray.toFixed(1)} ${dashGap.toFixed(1)}`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            className="gauge-ring-arc"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold"
          style={{ color }}
        >
          {clamped.toFixed(2)}
        </span>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  )
}
