'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Gauge, Heart, TrendingDown, TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { WeekGroup } from './sessions-table.types'
import {
  buildWeekCalendarData,
  getLocationLabel,
  getSessionTypeColor,
  getSessionTypeLabel,
  getWeekRange,
} from './sessions-table.utils'

export function WeeklyCalendar({ group }: { group: WeekGroup }): React.ReactElement {
  const days = useMemo(() => {
    const { start } = getWeekRange(group.sessions[0].date)
    return buildWeekCalendarData(group.sessions, start)
  }, [group])

  return (
    <TooltipProvider>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border bg-muted">
        {days.map((day, i) => (
          <div key={i} className={`min-h-16 ${i < 6 ? 'border-r' : ''}`}>
            <div className="border-b px-1.5 py-1 text-center">
              <div className="text-[10px] text-muted-foreground">{day.dayLabel}</div>
              <div className="text-xs text-muted-foreground/60">{day.dateNum}</div>
            </div>
            <div className="space-y-1 p-1">
              {day.sessions.map((session) => {
                const typeLabel = getSessionTypeLabel(session)
                const color = getSessionTypeColor(typeLabel)

                return (
                  <Tooltip key={session.id}>
                    <TooltipTrigger
                      className="flex w-full items-center gap-1 text-xs tabular-nums leading-tight"
                      render={<Link href={`/sessions/${session.id}`} />}
                    >
                      <span
                        className="inline-flex rounded-full w-2 aspect-square"
                        style={{ backgroundColor: color }}
                      />
                      <div className="font-medium">
                        {session.summary.distance}
                        <span className="text-xs">km</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="tabular-nums">
                      <div className="flex flex-col gap-1 py-0.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">
                            {typeLabel}
                            {getLocationLabel(session) && (
                              <span className="ml-1 font-normal text-background/50">
                                · {getLocationLabel(session)}
                              </span>
                            )}
                          </span>
                          <span className="text-background/60">{session.summary.duration}</span>
                        </div>
                        <div className="flex items-center gap-3 text-background/80">
                          <span className="flex items-center gap-1">
                            <Gauge className="size-3" />
                            {session.summary.avgPace}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="size-3" />
                            {session.summary.avgHeartRate}
                          </span>
                          <span className="flex items-center gap-1">
                            {session.splits.type === 'negative' ? (
                              <TrendingDown className="size-3" />
                            ) : (
                              <TrendingUp className="size-3" />
                            )}
                            {Math.abs(session.splits.diffSeconds)}s
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
