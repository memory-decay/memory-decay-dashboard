import type { DerivedMemoryState } from "@/lib/types"

export type DecayParams = {
  lambdaFact: number
  lambdaEpisode: number
  alpha: number
  rho: number
  floorMin: number
  floorMax: number
  floorPower: number
  gateCentre: number
  gateWidth: number
  consolidationGain: number
  minRateScale: number
  stabilityDecay: number
}

export const DEFAULT_DECAY_PARAMS: DecayParams = {
  lambdaFact: 0.02,
  lambdaEpisode: 0.035,
  alpha: 2.0,
  rho: 0.8,
  floorMin: 0.05,
  floorMax: 0.35,
  floorPower: 2.0,
  gateCentre: 0.4,
  gateWidth: 0.08,
  consolidationGain: 0.6,
  minRateScale: 0.1,
  stabilityDecay: 0.01,
}

/** Numerically stable logistic gate — mirrors _sigmoid_gate in decay.py */
export function sigmoidGate(value: number, center: number, width: number): number {
  const scaled = 2 * (value - center) / Math.max(width, 1e-6)
  if (scaled >= 0) {
    const z = Math.exp(-scaled)
    return 1.0 / (1.0 + z)
  }
  const z = Math.exp(scaled)
  return z / (1.0 + z)
}

/** Impact-based floor, clamped to never exceed current activation. */
export function computeFloor(
  impact: number,
  activation: number,
  params: DecayParams,
): number {
  const rawFloor =
    params.floorMin +
    (params.floorMax - params.floorMin) * Math.pow(impact, params.floorPower)
  return Math.min(rawFloor, activation)
}

/**
 * One tick of soft-floor decay — mirrors soft_floor_decay_step in decay.py.
 * Guarantees: floor <= result <= activation.
 */
export function softFloorDecayStep(
  activation: number,
  impact: number,
  stability: number,
  params: DecayParams & { lam: number },
): number {
  activation = Math.min(Math.max(activation, 0.0), 1.0)
  if (activation <= 0.0) return 0.0

  impact = Math.min(Math.max(impact, 0.0), 1.0)
  stability = Math.max(stability, 0.0)

  const combined = Math.max(
    Math.exp(params.alpha * impact) * (1.0 + params.rho * stability),
    1e-9,
  )
  const floor = computeFloor(impact, activation, params)

  const gate = sigmoidGate(activation, params.gateCentre, params.gateWidth)
  let rateScale = 1.0 - params.consolidationGain * impact * gate
  rateScale = Math.min(Math.max(rateScale, params.minRateScale), 1.0)
  const effectiveRate = Math.max(params.lam * rateScale / combined, 0.0)

  const updated = floor + (activation - floor) * Math.exp(-effectiveRate)
  return Math.min(Math.max(updated, floor), activation)
}

export type ProjectedPoint = { tick: number; storage: number; retrieval: number }

/**
 * Project a memory's storage and retrieval scores forward for `steps` ticks.
 * Returns steps+1 points (tick 0 = current state).
 * Stability also decays each tick (matching DecayEngine behavior).
 */
export function projectForward(
  memory: DerivedMemoryState,
  params: DecayParams,
  steps: number,
): ProjectedPoint[] {
  const lam =
    memory.mtype === "fact" ? params.lambdaFact : params.lambdaEpisode
  const stepParams = { ...params, lam }

  let storage = memory.storage_score
  let retrieval = memory.retrieval_score
  let stability = memory.stability_score
  const impact = memory.importance

  const points: ProjectedPoint[] = [{ tick: 0, storage, retrieval }]

  for (let t = 1; t <= steps; t++) {
    storage = softFloorDecayStep(storage, impact, stability, stepParams)
    retrieval = softFloorDecayStep(retrieval, impact, stability, stepParams)
    stability = Math.min(stability * (1.0 - params.stabilityDecay), 1.0)
    points.push({ tick: t, storage, retrieval })
  }

  return points
}

export type ChartDimensions = {
  x: number
  y: number
  width: number
  height: number
  maxTick: number
}

/** Convert projected points to an SVG path `d` string. */
export function svgPathFromPoints(
  points: ProjectedPoint[],
  accessor: (p: ProjectedPoint) => number,
  dim: ChartDimensions,
): string {
  if (points.length === 0) return ""

  const parts: string[] = []
  for (let i = 0; i < points.length; i++) {
    const px = dim.x + (points[i].tick / Math.max(dim.maxTick, 1)) * dim.width
    const py = dim.y + (1 - accessor(points[i])) * dim.height
    parts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return parts.join(" ")
}
