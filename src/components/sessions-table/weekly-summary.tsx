import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import type { WeekGroup } from './sessions-table.types'
import { formatDuration } from './sessions-table.utils'

interface StatCellProps {
  label: string
  value: string
  unit?: string
}

function StatCell({ label, value, unit }: StatCellProps): React.ReactElement {
  return (
    <div className="flex flex-col">
      <Text type="supporting" size="xsm" display="block">
        {label}
      </Text>
      <Text weight="semibold" hasTabularNumbers display="block">
        {value}
        {unit && (
          <Text type="supporting" size="sm">
            {' '}
            {unit}
          </Text>
        )}
      </Text>
    </div>
  )
}

export function WeeklySummary({ group }: { group: WeekGroup }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <Heading level={2}>{group.weekNumber}주차</Heading>
          <Text type="supporting">{group.weekRange}</Text>
        </div>
        <Text type="supporting" hasTabularNumbers>
          {group.sessionCount}회
        </Text>
      </div>
      <Card padding={3}>
        <div className="grid grid-cols-4 gap-3">
          <StatCell label="거리" value={group.totalDistance.toFixed(1)} unit="km" />
          <StatCell label="시간" value={formatDuration(group.totalDurationMinutes)} />
          <StatCell label="평균 HR" value={String(group.avgHeartRate)} unit="bpm" />
          <StatCell label="획득고도" value={String(group.totalAscent)} unit="m" />
        </div>
      </Card>
    </div>
  )
}
