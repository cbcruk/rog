'use client'

import { useMemo } from 'react'
import Link from 'next/link'
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
import { Gauge, Heart, TrendingDown, TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SessionsTableProps } from './sessions-table.types'
import type { SessionWithFeedback } from '@/types/running'
import {
  formatWeekRange,
  getISOWeek,
  getLocationLabel,
  getSessionTypeColor,
  getSessionTypeLabel,
  getWeekRange,
  parseDurationToMinutes,
} from './sessions-table.utils'

interface WeekGroup {
  week: string
  weekRange: string
  sessions: SessionWithFeedback[]
  totalDistance: number
  totalDurationMinutes: number
}

function groupSessionsByWeek(sessions: SessionWithFeedback[]): WeekGroup[] {
  const groups = new Map<string, WeekGroup>()

  for (const session of sessions) {
    const week = getISOWeek(session.date)
    const durationMinutes = parseDurationToMinutes(session.summary.duration)

    if (!groups.has(week)) {
      groups.set(week, {
        week,
        weekRange: formatWeekRange(session.date),
        sessions: [session],
        totalDistance: session.summary.distance,
        totalDurationMinutes: durationMinutes,
      })
    } else {
      const group = groups.get(week)!
      group.sessions.push(session)
      group.totalDistance += session.summary.distance
      group.totalDurationMinutes += durationMinutes
    }
  }

  return Array.from(groups.values())
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

interface CalendarDay {
  dayLabel: string
  dateNum: number
  sessions: SessionWithFeedback[]
}

function buildWeekCalendarData(group: WeekGroup): CalendarDay[] {
  const { start } = getWeekRange(group.sessions[0].date)

  const sessionsByDay = new Map<number, SessionWithFeedback[]>()
  for (const session of group.sessions) {
    const date = new Date(session.date)
    const dow = date.getUTCDay()
    const dayIndex = dow === 0 ? 6 : dow - 1
    const existing = sessionsByDay.get(dayIndex) || []
    existing.push(session)
    sessionsByDay.set(dayIndex, existing)
  }

  return DAY_LABELS.map((dayLabel, index) => {
    const cellDate = new Date(start)
    cellDate.setDate(start.getDate() + index)

    return {
      dayLabel,
      dateNum: cellDate.getDate(),
      sessions: sessionsByDay.get(index) || [],
    }
  })
}

interface FlowDataPoint {
  day: string
  distance: number
  avgHR: number | null
  color: string
  type: string
}

function buildWeekFlowData(group: WeekGroup): FlowDataPoint[] {
  const days = buildWeekCalendarData(group)

  return days.map((day) => {
    if (day.sessions.length === 0) {
      return {
        day: day.dayLabel,
        distance: 0,
        avgHR: null,
        color: 'var(--ui-2)',
        type: 'Rest',
      }
    }

    const totalDistance = day.sessions.reduce((sum, s) => sum + s.summary.distance, 0)
    const avgHR = Math.round(
      day.sessions.reduce((sum, s) => sum + s.summary.avgHeartRate, 0) / day.sessions.length,
    )
    const primary = day.sessions.reduce((a, b) => (b.summary.distance > a.summary.distance ? b : a))
    const typeLabel = getSessionTypeLabel(primary)

    return {
      day: day.dayLabel,
      distance: Math.round(totalDistance * 10) / 10,
      avgHR: avgHR,
      color: getSessionTypeColor(typeLabel),
      type: typeLabel,
    }
  })
}

function FlowChartTooltip({
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
    <div className="rounded-lg border border-ui bg-bg-2 px-3 py-2 text-xs shadow-md tabular-nums">
      <div className="font-medium">{data.type}</div>
      <div className="mt-1 flex flex-col gap-0.5 text-tx-2">
        <span>{data.distance} km</span>
        {data.avgHR && <span>HR {data.avgHR} bpm</span>}
      </div>
    </div>
  )
}

function WeeklyFlowChart({ group }: { group: WeekGroup }): React.ReactElement {
  const data = useMemo(() => buildWeekFlowData(group), [group])
  const maxDistance = Math.max(...data.map((d) => d.distance))

  return (
    <div className="mt-3 rounded-lg border border-ui bg-bg-2 p-3">
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
          <RechartsTooltip content={<FlowChartTooltip />} />
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

function WeeklyCalendar({ group }: { group: WeekGroup }): React.ReactElement {
  const days = useMemo(() => buildWeekCalendarData(group), [group])

  return (
    <TooltipProvider>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-ui bg-bg-2">
        {days.map((day, i) => (
          <div key={i} className={`min-h-16 ${i < 6 ? 'border-r border-ui' : ''}`}>
            <div className="border-b border-ui px-1.5 py-1 text-center">
              <div className="text-[10px] text-tx-2">{day.dayLabel}</div>
              <div className="text-xs text-tx-3">{day.dateNum}</div>
            </div>
            <div className="space-y-1 p-1">
              {day.sessions.map((session) => {
                const typeLabel = getSessionTypeLabel(session)
                const color = getSessionTypeColor(typeLabel)

                return (
                  <Tooltip key={session.id}>
                    <TooltipTrigger
                      className="flex w-full items-center gap-1 text-xs tabular-nums leading-tight"
                      render={<Link href={`/session/${session.id}`} />}
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

export function SessionsTable({ sessions }: SessionsTableProps): React.ReactElement {
  const weekGroups = useMemo(() => groupSessionsByWeek(sessions), [sessions])

  return (
    <div className="space-y-6">
      {weekGroups.map((group) => (
        <div key={group.week}>
          <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-1 py-2">
            <span className="font-semibold">{group.weekRange}</span>
            <span className="text-sm text-tx-2">
              {group.totalDistance.toFixed(1)}km · {formatDuration(group.totalDurationMinutes)}
            </span>
          </div>

          <WeeklyCalendar group={group} />
          <WeeklyFlowChart group={group} />
        </div>
      ))}
    </div>
  )
}
