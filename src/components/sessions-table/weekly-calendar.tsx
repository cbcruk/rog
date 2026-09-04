'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Gauge, Heart, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@astryxdesign/core/Card'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import type { SessionWithFeedback } from '@/types/running'
import type { WeekGroup } from './sessions-table.types'
import {
  buildWeekCalendarData,
  getLocationLabel,
  getSessionTypeColor,
  getSessionTypeLabel,
  getWeekRange,
} from './sessions-table.utils'

/**
 * 캘린더 도트에 걸리는 툴팁 본문.
 * 유형·장소·시간과 페이스/심박/스플릿을 한 덩어리로 보여준다.
 */
function SessionTooltip({ session }: { session: SessionWithFeedback }): React.ReactElement {
  const typeLabel = getSessionTypeLabel(session)
  const location = getLocationLabel(session)

  return (
    <span className="flex flex-col gap-1 tabular-nums">
      <span className="flex items-center justify-between gap-4">
        <span>
          {typeLabel}
          {location && ` · ${location}`}
        </span>
        <span>{session.summary.duration}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Icon icon={Gauge} size="xsm" />
          {session.summary.avgPace}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon={Heart} size="xsm" />
          {session.summary.avgHeartRate}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon={session.splits.type === 'negative' ? TrendingDown : TrendingUp} size="xsm" />
          {Math.abs(session.splits.diffSeconds)}s
        </span>
      </span>
    </span>
  )
}

export function WeeklyCalendar({ group }: { group: WeekGroup }): React.ReactElement {
  const days = useMemo(() => {
    const { start } = getWeekRange(group.sessions[0].date)
    return buildWeekCalendarData(group.sessions, start)
  }, [group])

  return (
    <Card padding={0}>
      <div className="grid grid-cols-7">
        {days.map((day, i) => (
          <div key={i} className={`min-h-16 ${i < 6 ? 'border-r border-border' : ''}`}>
            <div className="border-b border-border px-1.5 py-1 text-center">
              <Text type="supporting" size="xsm" display="block">
                {day.dayLabel}
              </Text>
              <Text color="disabled" size="sm" display="block">
                {day.dateNum}
              </Text>
            </div>
            <div className="flex flex-col gap-1 p-1">
              {day.sessions.map((session) => (
                <Tooltip
                  key={session.id}
                  content={<SessionTooltip session={session} />}
                  placement="below"
                >
                  <Link
                    href={`/sessions/${session.id}`}
                    className="flex w-full items-center gap-1 tabular-nums"
                  >
                    <span
                      aria-hidden
                      className="inline-flex w-2 shrink-0 rounded-full aspect-square"
                      style={{ backgroundColor: getSessionTypeColor(getSessionTypeLabel(session)) }}
                    />
                    <Text type="label" size="sm">
                      {session.summary.distance}km
                    </Text>
                  </Link>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
