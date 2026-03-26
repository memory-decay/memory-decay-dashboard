/**
 * Compute decay curve projection for a memory.
 *
 * A(t+1) = A(t) * exp(-λ_eff)
 * where λ_eff = λ / ((1 + α * impact) * (1 + ρ * stability))
 *
 * Default parameters from memory-decay-core:
 *   λ (base decay rate) = 0.1
 *   α (importance weight) = 0.5
 *   ρ (stability weight) = 0.3
 */
export interface DecayParams {
  lambda: number
  alpha: number
  rho: number
}

const DEFAULT_PARAMS: DecayParams = {
  lambda: 0.1,
  alpha: 0.5,
  rho: 0.3,
}

export interface DecayPoint {
  tick: number
  activation: number
}

export function computeDecayCurve(
  initialActivation: number,
  importance: number,
  stability: number,
  ticks: number = 200,
  params: DecayParams = DEFAULT_PARAMS,
): DecayPoint[] {
  const { lambda, alpha, rho } = params
  const lambdaEff = lambda / ((1 + alpha * importance) * (1 + rho * stability))

  const points: DecayPoint[] = []
  let activation = initialActivation

  for (let t = 0; t <= ticks; t++) {
    points.push({ tick: t, activation })
    activation = activation * Math.exp(-lambdaEff)
  }

  return points
}

/**
 * Estimate ticks until activation drops below a threshold.
 */
export function ticksUntilThreshold(
  initialActivation: number,
  importance: number,
  stability: number,
  threshold: number = 0.01,
  params: DecayParams = DEFAULT_PARAMS,
): number {
  const { lambda, alpha, rho } = params
  const lambdaEff = lambda / ((1 + alpha * importance) * (1 + rho * stability))

  if (lambdaEff <= 0) return Infinity
  return Math.ceil(Math.log(threshold / initialActivation) / -lambdaEff)
}
