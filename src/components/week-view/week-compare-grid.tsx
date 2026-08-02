import Link from 'next/link'
import {
  getPlannedTypeColor,
  getPlannedTypeLabel,
  formatMinutes,
} from '@/components/program-editor/program-editor.utils'
import {
  getSessionTypeColor,
  getSessionTypeLabel,
} from '@/components/sessions-table/sessions-table.utils'
import type { WeekEntry, WeekPlanDay } from '@/lib/week-plan'

interface WeekCompareGridProps {
  days: WeekPlanDay[]
}

/** 계획 대비 실제 값의 차이를 "+1.2" 형태로 표시한다. 차이가 미미하면 null을 반환한다. */
function formatDelta(actual: number, planned: number, unit: string): string | null {
  const delta = actual - planned
  if (Math.abs(delta) < 0.1) return null

  const rounded = Math.round(delta * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`
}

function EntryCard({ entry, isPast }: { entry: WeekEntry; isPast: boolean }): React.ReactElement {
  const { planned, actual, status } = entry

  if (status === 'missed' && planned) {
    return (
      <div
        className={`rounded-md border border-dashed px-1.5 py-1 ${
          isPast ? 'border-destructive/40' : 'border-border'
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            className="inline-flex w-2 shrink-0 rounded-full opacity-40 aspect-square"
            style={{ backgroundColor: getPlannedTypeColor(planned.type) }}
          />
          <span className="truncate text-[11px] text-muted-foreground">
            {getPlannedTypeLabel(planned.type)}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
          {formatMinutes(planned.durationMinutes)}
          {planned.distanceKm ? ` · ${planned.distanceKm}km` : ''}
        </div>
        <div className={`text-[10px] ${isPast ? 'text-destructive' : 'text-muted-foreground/60'}`}>
          {isPast ? '미실시' : '예정'}
        </div>
      </div>
    )
  }

  if (!actual) return <></>

  const label = getSessionTypeLabel(actual)
  const actualMinutes = actual.summary.durationSeconds / 60
  const distanceDelta = planned?.distanceKm
    ? formatDelta(actual.summary.distance, planned.distanceKm, 'km')
    : null
  const timeDelta = planned ? formatDelta(actualMinutes, planned.durationMinutes, '분') : null

  return (
    <Link
      href={`/sessions/${actual.id}`}
      className="block rounded-md bg-background px-1.5 py-1 transition-colors hover:bg-foreground/5"
    >
      <div className="flex items-center gap-1">
        <span
          className="inline-flex w-2 shrink-0 rounded-full aspect-square"
          style={{ backgroundColor: getSessionTypeColor(label) }}
        />
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
        {formatMinutes(actualMinutes)} · {actual.summary.distance}km
      </div>
      {status === 'unplanned' ? (
        <div className="text-[10px] text-muted-foreground/60">계획 외</div>
      ) : (
        (distanceDelta || timeDelta) && (
          <div className="text-[10px] tabular-nums text-muted-foreground/60">
            계획 대비 {[distanceDelta, timeDelta].filter(Boolean).join(' · ')}
          </div>
        )
      )}
    </Link>
  )
}

/**
 * 이번 주 계획과 실적을 겹쳐 보여주는 7열 그리드.
 * 프로그램 에디터와 같은 레이아웃을 써서, 설계한 주가 실제로 어떻게 채워졌는지 같은 형태로 읽힌다.
 */
export function WeekCompareGrid({ days }: WeekCompareGridProps): React.ReactElement {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border bg-muted">
      {days.map((day) => (
        <div
          key={day.date}
          className={`flex min-h-32 flex-col ${day.dayIndex < 6 ? 'border-r' : ''} ${
            day.isToday ? 'bg-foreground/5' : ''
          }`}
        >
          <div className="border-b px-2 py-1 text-center">
            <div className="text-[10px] text-muted-foreground">{day.dayLabel}</div>
            <div
              className={`text-xs tabular-nums ${
                day.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground/60'
              }`}
            >
              {day.dateNum}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1 p-1.5">
            {day.entries.length === 0 ? (
              <span className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground/40">
                휴식
              </span>
            ) : (
              day.entries.map((entry) => (
                <EntryCard key={entry.key} entry={entry} isPast={day.isPast} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
