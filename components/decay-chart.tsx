"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { computeDecayCurve } from "@/lib/decay"

interface DecayChartProps {
  initialActivation: number
  importance: number
  stability: number
  ticks?: number
}

export default function DecayChart({
  initialActivation,
  importance,
  stability,
  ticks = 200,
}: DecayChartProps) {
  const data = useMemo(
    () => computeDecayCurve(initialActivation, importance, stability, ticks),
    [initialActivation, importance, stability, ticks],
  )

  return (
    <div className="chart-section">
      <div className="label mb-3">활성도 감쇠 곡선 (200틱 투영)</div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="decayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c9cff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7c9cff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#263042" />
          <XAxis
            dataKey="tick"
            stroke="#70809c"
            fontSize={11}
            tickLine={false}
            label={{ value: "틱", position: "insideBottomRight", offset: -5, style: { fill: "#70809c", fontSize: 10 } }}
          />
          <YAxis
            stroke="#70809c"
            fontSize={11}
            tickLine={false}
            domain={[0, 1]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              background: "#151821",
              border: "1px solid #263042",
              borderRadius: 8,
              fontSize: 12,
              color: "#f8fafc",
            }}
            formatter={(value) => [Number(value).toFixed(4), "활성도"]}
            labelFormatter={(label) => `틱 ${label}`}
          />
          <ReferenceLine y={0.01} stroke="#f87171" strokeDasharray="5 5" label={{ value: "망각 임계값", fill: "#f87171", fontSize: 10 }} />
          <Area
            type="monotone"
            dataKey="activation"
            stroke="#7c9cff"
            strokeWidth={2}
            fill="url(#decayGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
