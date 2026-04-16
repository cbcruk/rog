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
    <div className="flex flex-col gap-6">
      {weekGroups.map((group) => (
        <div key={group.week} className="flex flex-col gap-4">
          <WeeklySummary group={group} />
          <WeeklyCalendar group={group} />
          <WeeklyFlowChart group={group} />
        </div>
      ))}
    </div>
  )
}
