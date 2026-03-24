import { projectForward, svgPathFromPoints, DEFAULT_DECAY_PARAMS } from "@/lib/decay-curve"
import type { DerivedMemoryState } from "@/lib/types"

type SparklineProps = {
  memory: DerivedMemoryState
}

const STEPS = 30
const DIM = { x: 0, y: 0, width: 64, height: 28, maxTick: STEPS }

function scoreColor(score: number): string {
  if (score > 0.6) return "rgba(52,211,153,"
  if (score > 0.3) return "rgba(245,166,91,"
  return "rgba(248,113,113,"
}

export function Sparkline({ memory }: SparklineProps) {
  const points = projectForward(memory, DEFAULT_DECAY_PARAMS, STEPS)
  const linePath = svgPathFromPoints(points, (p) => p.storage, DIM)
  const colorBase = scoreColor(memory.storage_score)

  const lastX = (points[points.length - 1].tick / STEPS) * 64
  const areaPath = `${linePath} L${lastX.toFixed(1)},28 L0,28 Z`

  return (
    <div className="h-[28px] w-[64px] flex-shrink-0 opacity-0 sparkline-fade-in">
      <svg viewBox="0 0 64 28" className="h-full w-full">
        <defs>
          <linearGradient id={`spark-${memory.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${colorBase}0.15)`} />
            <stop offset="100%" stopColor={`${colorBase}0)`} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#spark-${memory.id})`} />
        <path d={linePath} fill="none" stroke={`${colorBase}0.6)`} strokeWidth={1.5} />
      </svg>
    </div>
  )
}
