import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
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
    <Card padding={2} elevation="med">
      <Text type="label" display="block">
        {data.type}
      </Text>
      <Text type="supporting" hasTabularNumbers display="block">
        {data.distance} km
      </Text>
      {data.avgHR && (
        <Text type="supporting" hasTabularNumbers display="block">
          HR {data.avgHR} bpm
        </Text>
      )}
    </Card>
  )
}
