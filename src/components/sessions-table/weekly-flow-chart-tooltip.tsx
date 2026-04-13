import type { FlowDataPoint } from './sessions-table.types'

export function WeeklyFlowChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    payload: FlowDataPoint
    dataKey: string
    value: number
  }>
}): React.ReactElement | null {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  if (data.distance === 0) return null

  return (
    <div className="rounded-lg border bg-muted px-3 py-2 text-xs shadow-md tabular-nums">
      <div className="font-medium">{data.type}</div>
      <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
        <span>{data.distance} km</span>
        {data.avgHR && <span>HR {data.avgHR} bpm</span>}
      </div>
    </div>
  )
}
