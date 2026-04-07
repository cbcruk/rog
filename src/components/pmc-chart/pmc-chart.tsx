'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import type { PMCChartProps } from './pmc-chart.types'

const COLORS = {
  ctl: 'var(--color-blue)',
  atl: 'var(--color-magenta)',
  tsbPositive: 'var(--color-green)',
  tsbNegative: 'var(--color-red)',
  grid: 'var(--color-tx-3)',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}): React.ReactElement | null {
  if (!active || !payload) return null

  return (
    <div className="rounded-lg border border-tx-3 bg-bg p-3 shadow-lg">
      <p className="mb-2 text-sm text-tx-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}
        </p>
      ))}
    </div>
  )
}

export function PMCChart({
  data,
  height = 300,
  showLegend = true,
}: PMCChartProps): React.ReactElement {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
    tsbFill: d.tsb >= 0 ? COLORS.tsbPositive : COLORS.tsbNegative,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.ctl} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.ctl} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="atlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.atl} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.atl} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.3} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ paddingTop: 16 }} iconType="line" />}
        <ReferenceLine y={0} stroke={COLORS.grid} strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="ctl"
          name="CTL (Fitness)"
          stroke={COLORS.ctl}
          fill="url(#ctlGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="atl"
          name="ATL (Fatigue)"
          stroke={COLORS.atl}
          fill="url(#atlGradient)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="tsb"
          name="TSB (Form)"
          stroke={COLORS.tsbPositive}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
