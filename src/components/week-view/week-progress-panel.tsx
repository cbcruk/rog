import { formatMinutes } from '@/components/program-editor/program-editor.utils'
import { getCompletionPercent } from '@/lib/week-plan'
import type { WeekTotals } from '@/lib/week-plan'

interface WeekProgressPanelProps {
  planned: WeekTotals
  actual: WeekTotals
  missedCount: number
  unplannedCount: number
  /** 적용 중인 프로그램이 없으면 실적만 표시한다 */
  hasProgram: boolean
}

interface ProgressRowProps {
  label: string
  actualText: string
  plannedText: string
  percent: number | null
}

/** 달성률 구간별 색상. 미달일수록 흐려진다. */
function getPercentColor(percent: number): string {
  if (percent >= 95) return 'var(--green)'
  if (percent >= 70) return 'var(--yellow)'
  return 'var(--muted-foreground)'
}

function ProgressRow({
  label,
  actualText,
  plannedText,
  percent,
}: ProgressRowProps): React.ReactElement {
  const color = percent === null ? 'var(--muted-foreground)' : getPercentColor(percent)

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums">
          <span className="font-semibold">{actualText}</span>
          <span className="text-muted-foreground"> / {plannedText}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          {percent !== null && (
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
            />
          )}
        </div>
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums" style={{ color }}>
          {percent === null ? '—' : `${percent}%`}
        </span>
      </div>
    </div>
  )
}

/**
 * 이번 주 계획 대비 달성률 패널.
 * 프로그램이 없으면 기준선이 없다는 뜻이므로 달성률 대신 실적만 보여준다.
 */
export function WeekProgressPanel({
  planned,
  actual,
  missedCount,
  unplannedCount,
  hasProgram,
}: WeekProgressPanelProps): React.ReactElement {
  if (!hasProgram) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">
          적용 중인 프로그램이 없어 비교할 기준이 없습니다. 프로그램 화면에서 &ldquo;현재
          적용&rdquo;을 체크해 저장하세요.
        </p>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="flex flex-col bg-background px-3 py-2">
            <span className="text-[11px] text-muted-foreground">실제 거리</span>
            <span className="text-sm font-semibold tabular-nums">
              {actual.distance.toFixed(1)}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">km</span>
            </span>
          </div>
          <div className="flex flex-col bg-background px-3 py-2">
            <span className="text-[11px] text-muted-foreground">실제 시간</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatMinutes(actual.minutes)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b px-3 py-2 text-xs font-medium">계획 대비 달성률</div>

        <div className="flex flex-col divide-y">
          <ProgressRow
            label="거리"
            actualText={`${actual.distance.toFixed(1)}km`}
            plannedText={`${planned.distance.toFixed(1)}km`}
            percent={getCompletionPercent(actual.distance, planned.distance)}
          />
          <ProgressRow
            label="시간"
            actualText={formatMinutes(actual.minutes)}
            plannedText={formatMinutes(planned.minutes)}
            percent={getCompletionPercent(actual.minutes, planned.minutes)}
          />
          <ProgressRow
            label="역치 존"
            actualText={`${actual.thresholdMinutes}분`}
            plannedText={`${planned.thresholdMinutes}분`}
            percent={getCompletionPercent(actual.thresholdMinutes, planned.thresholdMinutes)}
          />
          <ProgressRow
            label="세션"
            actualText={`${actual.sessionCount}회`}
            plannedText={`${planned.sessionCount}회`}
            percent={getCompletionPercent(actual.sessionCount, planned.sessionCount)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">미실시</span>
          <span className="text-xs tabular-nums">{missedCount}회</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">계획 외</span>
          <span className="text-xs tabular-nums">{unplannedCount}회</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">Z3 초과</span>
          <span className="text-xs tabular-nums">
            {actual.supraMinutes}분
            <span className="text-muted-foreground"> / {planned.supraMinutes}분</span>
          </span>
        </div>
      </div>
    </div>
  )
}
