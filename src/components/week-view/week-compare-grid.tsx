import Link from 'next/link'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
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
          isPast ? 'border-error' : 'border-border'
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            aria-hidden
            className="inline-flex w-2 shrink-0 rounded-full opacity-40 aspect-square"
            style={{ backgroundColor: getPlannedTypeColor(planned.type) }}
          />
          <Text type="supporting" size="sm" maxLines={1}>
            {getPlannedTypeLabel(planned.type)}
          </Text>
        </div>
        <Text type="supporting" size="xsm" hasTabularNumbers display="block">
          {formatMinutes(planned.durationMinutes)}
          {planned.distanceKm ? ` · ${planned.distanceKm}km` : ''}
        </Text>
        <Text
          size="xsm"
          display="block"
          color={isPast ? undefined : 'disabled'}
          style={isPast ? { color: 'var(--color-error)' } : undefined}
        >
          {isPast ? '미실시' : '예정'}
        </Text>
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
      className="block rounded-md bg-surface px-1.5 py-1 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-1">
        <span
          aria-hidden
          className="inline-flex w-2 shrink-0 rounded-full aspect-square"
          style={{ backgroundColor: getSessionTypeColor(label) }}
        />
        <Text type="label" size="sm" maxLines={1}>
          {label}
        </Text>
      </div>
      <Text type="supporting" size="xsm" hasTabularNumbers display="block">
        {formatMinutes(actualMinutes)} · {actual.summary.distance}km
      </Text>
      {status === 'unplanned' ? (
        <Text color="disabled" size="xsm" display="block">
          계획 외
        </Text>
      ) : (
        (distanceDelta || timeDelta) && (
          <Text color="disabled" size="xsm" hasTabularNumbers display="block">
            계획 대비 {[distanceDelta, timeDelta].filter(Boolean).join(' · ')}
          </Text>
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
    <Card padding={0}>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex min-h-32 flex-col ${
              day.dayIndex < 6 ? 'border-r border-border' : ''
            } ${day.isToday ? 'bg-muted' : ''}`}
          >
            <div className="border-b border-border px-2 py-1 text-center">
              <Text type="supporting" size="xsm" display="block">
                {day.dayLabel}
              </Text>
              <Text
                size="sm"
                display="block"
                hasTabularNumbers
                weight={day.isToday ? 'semibold' : undefined}
                color={day.isToday ? 'primary' : 'disabled'}
              >
                {day.dateNum}
              </Text>
            </div>

            <div className="flex flex-1 flex-col gap-1 p-1.5">
              {day.entries.length === 0 ? (
                <span className="flex flex-1 items-center justify-center">
                  <Text color="disabled" size="sm">
                    휴식
                  </Text>
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
    </Card>
  )
}
