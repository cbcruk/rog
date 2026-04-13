'use client'

import { useMemo } from 'react'
import type { SessionsTableProps } from './sessions-table.types'
import { groupSessionsByWeek } from './sessions-table.utils'
import { WeeklyCalendar } from './weekly-calendar'
import { WeeklyFlowChart } from './weekly-flow-chart'
import { WeeklySummary } from './weekly-summary'

export function SessionsTable({ sessions }: SessionsTableProps): React.ReactElement {
  const weekGroups = useMemo(() => groupSessionsByWeek(sessions), [sessions])

  return (
    <div className="space-y-6">
      {weekGroups.map((group) => (
        <div key={group.week}>
          <WeeklySummary group={group} />
          <WeeklyCalendar group={group} />
          <WeeklyFlowChart group={group} />
        </div>
      ))}
    </div>
  )
}
