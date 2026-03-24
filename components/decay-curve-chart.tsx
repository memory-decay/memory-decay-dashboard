import {
  projectForward,
  svgPathFromPoints,
  computeFloor,
  DEFAULT_DECAY_PARAMS,
} from "@/lib/decay-curve"
import type { DerivedMemoryState } from "@/lib/types"

type DecayCurveChartProps = {
  memory: DerivedMemoryState
}

const STEPS = 100
const CHART = { x: 50, y: 10, width: 560, height: 160, maxTick: STEPS }
const SVG_W = 640
const SVG_H = 200

function yPos(score: number): number {
  return CHART.y + (1 - score) * CHART.height
}

function xPos(tick: number): number {
  return CHART.x + (tick / STEPS) * CHART.width
}

export function DecayCurveChart({ memory }: DecayCurveChartProps) {
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, STEPS)
  const storagePath = svgPathFromPoints(points, (p) => p.storage, CHART)
  const retrievalPath = svgPathFromPoints(points, (p) => p.retrieval, CHART)
  const floor = computeFloor(memory.importance, memory.storage_score, DEFAULT_DECAY_PARAMS)

  const lastX = xPos(STEPS)
  const bottomY = CHART.y + CHART.height
  const storageAreaPath = `${storagePath} L${lastX.toFixed(1)},${bottomY} L${CHART.x},${bottomY} Z`

  const yLabels = [
    { value: 1.0, label: "1.0" },
    { value: 0.75, label: "0.75" },
    { value: 0.5, label: "0.50" },
    { value: 0.25, label: "0.25" },
    { value: 0.0, label: "0.0" },
  ]

  const xLabels = [0, 25, 50, 75, 100]

  return (
    <div className="chart-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Approximate projection</p>
          <h3 className="mt-1 text-[15px] font-semibold text-text-primary">
            Projected decay from current state
          </h3>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="inline-block h-[2px] w-4 rounded-full bg-status-danger" />
            Storage
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="inline-block h-[2px] w-4 rounded-full bg-status-stable" />
            Retrieval
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span
              className="inline-block h-[1px] w-4"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #f5a65b 0px, #f5a65b 4px, transparent 4px, transparent 8px)",
              }}
            />
            Floor
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mt-3 w-full">
        <defs>
          <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
          <filter id="glow-now" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Axes */}
        <line
          x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={bottomY}
          stroke="rgba(124,156,255,0.08)" strokeWidth={0.5}
        />
        <line
          x1={CHART.x} y1={bottomY} x2={lastX} y2={bottomY}
          stroke="rgba(124,156,255,0.08)" strokeWidth={0.5}
        />

        {/* Y gridlines + labels */}
        {yLabels.map(({ value, label }) => (
          <g key={`y-${label}`}>
            {value > 0 && value < 1 && (
              <line
                x1={CHART.x} y1={yPos(value)} x2={lastX} y2={yPos(value)}
                stroke="rgba(124,156,255,0.04)" strokeWidth={0.5} strokeDasharray="4,4"
              />
            )}
            <text
              x={CHART.x - 6} y={yPos(value) + 3}
              fill="#70809c" fontSize={9} textAnchor="end" fontFamily="DM Mono, monospace"
            >
              {label}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((tick) => (
          <text
            key={`x-${tick}`}
            x={xPos(tick)} y={bottomY + 14}
            fill="#70809c" fontSize={8} textAnchor="middle" fontFamily="DM Mono, monospace"
          >
            +{tick}
          </text>
        ))}
        <text
          x={xPos(50)} y={bottomY + 26}
          fill="#505a70" fontSize={8} textAnchor="middle" fontFamily="DM Sans, sans-serif"
        >
          ticks from now
        </text>

        {/* Impact floor */}
        <line
          x1={CHART.x} y1={yPos(floor)} x2={lastX} y2={yPos(floor)}
          stroke="#f5a65b" strokeWidth={1} strokeDasharray="6,4" opacity={0.4}
        />

        {/* NOW marker */}
        <line
          x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={bottomY}
          stroke="rgba(124,156,255,0.2)" strokeWidth={1} strokeDasharray="3,3"
        />
        <text
          x={CHART.x} y={CHART.y - 3}
          fill="#7c9cff" fontSize={8} textAnchor="middle" fontFamily="DM Mono, monospace"
        >
          NOW
        </text>

        {/* Storage curve + area */}
        <path d={storageAreaPath} fill="url(#storageFill)" opacity={0.1} />
        <path
          d={storagePath} fill="none" stroke="#f87171" strokeWidth={1.8}
          strokeDasharray="6,4" opacity={0.7}
        />

        {/* Retrieval curve */}
        <path
          d={retrievalPath} fill="none" stroke="#34d399" strokeWidth={1.8}
          strokeDasharray="6,4" opacity={0.5}
        />

        {/* Current position dots */}
        <circle
          cx={CHART.x} cy={yPos(memory.storage_score)} r={4}
          fill="#f87171" filter="url(#glow-now)"
        />
        <circle
          cx={CHART.x} cy={yPos(memory.retrieval_score)} r={3.5}
          fill="#34d399" filter="url(#glow-now)"
        />
      </svg>
    </div>
  )
}
