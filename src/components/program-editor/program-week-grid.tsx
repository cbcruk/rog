'use client'

import { Plus } from 'lucide-react'
import { Card } from '@astryxdesign/core/Card'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import { groupSessionsByDay } from '@/lib/program-metrics'
import type { PlannedSession } from '@/types/program'
import {
  DAY_LABELS,
  formatMinutes,
  getPlannedTypeColor,
  getPlannedTypeLabel,
} from './program-editor.utils'

interface ProgramWeekGridProps {
  sessions: PlannedSession[]
  selectedDay: number | null
  onSelectDay: (dayIndex: number) => void
}

/**
 * 프로그램의 7일 구성을 보여주는 편집용 주간 그리드.
 * 세션 로그의 WeeklyCalendar와 같은 7열 레이아웃을 쓰되, 각 칸이 요일 선택 버튼으로 동작한다.
 */
export function ProgramWeekGrid({
  sessions,
  selectedDay,
  onSelectDay,
}: ProgramWeekGridProps): React.ReactElement {
  const days = groupSessionsByDay(sessions)

  return (
    <Card padding={0}>
      <div className="grid grid-cols-7">
        {days.map((daySessions, dayIndex) => {
          const selected = selectedDay === dayIndex
          const isHard = daySessions.some((s) => s.thresholdMinutes > 0 || s.supraMinutes > 0)

          return (
            <button
              key={dayIndex}
              type="button"
              onClick={() => onSelectDay(dayIndex)}
              aria-pressed={selected}
              className={`flex min-h-32 flex-col text-left transition-colors ${
                dayIndex < 6 ? 'border-r border-border' : ''
              } ${selected ? 'bg-muted' : 'hover:bg-muted'}`}
            >
              <div className="flex w-full items-center justify-between border-b border-border px-2 py-1">
                <Text type="label" size="sm">
                  {DAY_LABELS[dayIndex]}
                </Text>
                {isHard && (
                  <span
                    aria-hidden
                    className="inline-flex w-1.5 rounded-full aspect-square"
                    style={{ backgroundColor: 'var(--color-data-categorical-red)' }}
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-1.5">
                {daySessions.length === 0 ? (
                  <span className="flex flex-1 items-center justify-center gap-1">
                    <Icon icon={Plus} size="xsm" color="disabled" />
                    <Text color="disabled" size="sm">
                      휴식
                    </Text>
                  </span>
                ) : (
                  daySessions.map((session) => (
                    <div key={session.id} className="rounded-md bg-surface px-1.5 py-1">
                      <div className="flex items-center gap-1">
                        <span
                          aria-hidden
                          className="inline-flex w-2 shrink-0 rounded-full aspect-square"
                          style={{ backgroundColor: getPlannedTypeColor(session.type) }}
                        />
                        <Text type="label" size="sm" maxLines={1}>
                          {getPlannedTypeLabel(session.type)}
                        </Text>
                      </div>
                      <Text type="supporting" size="xsm" hasTabularNumbers display="block">
                        {formatMinutes(session.durationMinutes)}
                        {session.distanceKm ? ` · ${session.distanceKm}km` : ''}
                      </Text>
                      {session.thresholdMinutes > 0 && (
                        <Text
                          size="xsm"
                          hasTabularNumbers
                          display="block"
                          style={{ color: 'var(--color-data-categorical-red)' }}
                        >
                          역치 {session.thresholdMinutes}분
                        </Text>
                      )}
                      {session.supraMinutes > 0 && (
                        <Text
                          size="xsm"
                          hasTabularNumbers
                          display="block"
                          style={{ color: 'var(--color-data-categorical-purple)' }}
                        >
                          Z3 {session.supraMinutes}분
                        </Text>
                      )}
                    </div>
                  ))
                )}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
