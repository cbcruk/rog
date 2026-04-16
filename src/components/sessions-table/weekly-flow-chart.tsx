'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts'
import type { WeekGroup } from './sessions-table.types'
import { buildWeekFlowData, getWeekRange } from './sessions-table.utils'
import { WeeklyFlowChartTooltip } from './weekly-flow-chart-tooltip'

export function WeeklyFlowChart({ group }: { group: WeekGroup }): React.ReactElement {
  const data = useMemo(() => {
    const { start } = getWeekRange(group.sessions[0].date)
    return buildWeekFlowData(group.sessions, start)
  }, [group])
  const maxDistance = Math.max(...data.map((d) => d.distance))

  return (
    <div className="rounded-lg border bg-muted p-3">
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="distance"
            domain={[0, Math.ceil(maxDistance * 1.2)]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <YAxis yAxisId="hr" orientation="right" domain={['dataMin - 10', 'dataMax + 10']} hide />
          <RechartsTooltip content={<WeeklyFlowChartTooltip />} />
          <Bar yAxisId="distance" dataKey="distance" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
          <Line
            yAxisId="hr"
            dataKey="avgHR"
            type="monotone"
            stroke="var(--red)"
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: 'var(--red)' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
