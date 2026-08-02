'use client'

import { Plus } from 'lucide-react'
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
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border bg-muted">
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
              dayIndex < 6 ? 'border-r' : ''
            } ${selected ? 'bg-foreground/5' : 'hover:bg-foreground/[0.02]'}`}
          >
            <div
              className={`flex w-full items-center justify-between border-b px-2 py-1 ${
                selected ? 'border-foreground/20' : ''
              }`}
            >
              <span className="text-[11px] font-medium">{DAY_LABELS[dayIndex]}</span>
              {isHard && (
                <span
                  className="inline-flex w-1.5 rounded-full aspect-square"
                  style={{ backgroundColor: 'var(--red)' }}
                />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-1.5">
              {daySessions.length === 0 ? (
                <span className="flex flex-1 items-center justify-center gap-1 text-[11px] text-muted-foreground/50">
                  <Plus className="size-3" />
                  휴식
                </span>
              ) : (
                daySessions.map((session) => (
                  <div key={session.id} className="rounded-md bg-background px-1.5 py-1">
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-flex w-2 shrink-0 rounded-full aspect-square"
                        style={{ backgroundColor: getPlannedTypeColor(session.type) }}
                      />
                      <span className="truncate text-[11px] font-medium">
                        {getPlannedTypeLabel(session.type)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {formatMinutes(session.durationMinutes)}
                      {session.distanceKm ? ` · ${session.distanceKm}km` : ''}
                    </div>
                    {session.thresholdMinutes > 0 && (
                      <div className="text-[10px] tabular-nums" style={{ color: 'var(--red)' }}>
                        역치 {session.thresholdMinutes}분
                      </div>
                    )}
                    {session.supraMinutes > 0 && (
                      <div className="text-[10px] tabular-nums" style={{ color: 'var(--purple)' }}>
                        Z3 {session.supraMinutes}분
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
