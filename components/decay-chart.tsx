"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts"
import { computeDecayCurve } from "@/lib/decay"
import { useChartColors, getChartTooltipStyle, getChartPalette } from "@/lib/theme-colors"

interface DecayChartProps {
  initialActivation: number
  importance: number
  stability: number
  ticks?: number
  showThresholds?: boolean
}

export default function DecayChart({
  initialActivation,
  importance,
  stability,
  ticks = 200,
  showThresholds = true,
}: DecayChartProps) {
  const t = useTranslations('decayChart')
  const colors = useChartColors()
  const palette = getChartPalette(colors)

  const data = useMemo(
    () => computeDecayCurve(initialActivation, importance, stability, ticks),
    [initialActivation, importance, stability, ticks],
  )

  // Calculate key metrics for visualization
  const criticalPoint = useMemo(() => {
    const idx = data.findIndex(d => d.activation <= 0.01)
    return idx > 0 ? data[idx] : null
  }, [data])

  const halfLifePoint = useMemo(() => {
    const target = initialActivation / 2
    const idx = data.findIndex(d => d.activation <= target)
    return idx > 0 ? data[idx] : null
  }, [data, initialActivation])

  return (
    <div className="chart-section">
      <div className="flex items-center justify-between mb-3">
        <div className="label">{t('title', { ticks: 200 })}</div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-accent/30 border border-accent" />
            <span className="text-text-muted">{t('activation')}</span>
          </span>
          {showThresholds && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-status-danger/30 border border-status-danger" />
              <span className="text-text-muted">{t('threshold')}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-surface-1 border border-border p-3 shadow-sm">
        <div className="text-xs font-medium text-text-secondary mb-1">{t('formula')}</div>
        <div className="text-xs text-text-muted font-mono">{t('formulaDetail')}</div>
        <div className="text-xs text-text-muted mt-1.5">{t('params')}</div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {/* Multi-stop gradient for visual interest */}
            <linearGradient id="decayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent} stopOpacity={0.4} />
              <stop offset="50%" stopColor={palette[3]} stopOpacity={0.2} />
              <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
            </linearGradient>
            {/* Threshold zone gradient */}
            <linearGradient id="thresholdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.danger} stopOpacity={0.1} />
              <stop offset="100%" stopColor={colors.danger} stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />

          <XAxis
            dataKey="tick"
            stroke={colors.textMuted}
            fontSize={11}
            tickLine={false}
            label={{
              value: t('xAxis'),
              position: "insideBottomRight",
              offset: -5,
              style: { fill: colors.textMuted, fontSize: 10, fontWeight: 600 }
            }}
          />

          <YAxis
            stroke={colors.textMuted}
            fontSize={11}
            tickLine={false}
            domain={[0, 1]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />

          <Tooltip
            contentStyle={getChartTooltipStyle(colors)}
            formatter={(value) => [Number(value).toFixed(4), t('activation')]}
            labelFormatter={(label) => `${t('tick')} ${label}`}
          />

          {/* Threshold zone */}
          {showThresholds && (
            <>
              <ReferenceLine
                y={0.01}
                stroke={colors.danger}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: t('threshold'),
                  fill: colors.danger,
                  fontSize: 10,
                  fontWeight: 700,
                  position: 'right'
                }}
              />
              {/* Critical point marker */}
              {criticalPoint && (
                <ReferenceDot
                  x={criticalPoint.tick}
                  y={criticalPoint.activation}
                  r={6}
                  fill={colors.danger}
                  stroke={colors.border}
                  strokeWidth={2}
                />
              )}
              {/* Half-life marker */}
              {halfLifePoint && (
                <ReferenceDot
                  x={halfLifePoint.tick}
                  y={halfLifePoint.activation}
                  r={5}
                  fill={palette[2]}
                  stroke={colors.border}
                  strokeWidth={2}
                />
              )}
            </>
          )}

          <Area
            type="monotone"
            dataKey="activation"
            stroke={colors.accent}
            strokeWidth={2.5}
            fill="url(#decayGradient)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
        <span className="inline-block w-2 h-2 rounded-full bg-status-danger" />
        <span>{t('markers')}</span>
      </div>
    </div>
  )
}
