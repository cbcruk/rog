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
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { CHART_CHROME_COLOR, PMC_SERIES_COLOR } from './pmc-chart.colors'
import type { PMCChartProps } from './pmc-chart.types'

const AXIS_TICK = { fontSize: 12, fill: CHART_CHROME_COLOR.axis }

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
    <Card padding={2} elevation="med">
      <Text type="supporting" display="block">
        {label}
      </Text>
      {payload.map((entry) => (
        <Text key={entry.name} display="block" hasTabularNumbers style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}
        </Text>
      ))}
    </Card>
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
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PMC_SERIES_COLOR.ctl} stopOpacity={0.3} />
            <stop offset="95%" stopColor={PMC_SERIES_COLOR.ctl} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="atlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PMC_SERIES_COLOR.atl} stopOpacity={0.3} />
            <stop offset="95%" stopColor={PMC_SERIES_COLOR.atl} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_CHROME_COLOR.grid} />
        <XAxis dataKey="dateLabel" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ paddingTop: 16 }} iconType="line" />}
        <ReferenceLine y={0} stroke={CHART_CHROME_COLOR.grid} strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="ctl"
          name="CTL (체력)"
          stroke={PMC_SERIES_COLOR.ctl}
          fill="url(#ctlGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="atl"
          name="ATL (피로)"
          stroke={PMC_SERIES_COLOR.atl}
          fill="url(#atlGradient)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="tsb"
          name="TSB (폼)"
          stroke={PMC_SERIES_COLOR.tsb}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
