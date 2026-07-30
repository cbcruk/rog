'use client'

import type { ProgramTotals } from '@/types/program'
import { formatMinutes } from './program-editor.utils'

interface ProgramSummaryPanelProps {
  totals: ProgramTotals
}

interface ZoneBand {
  label: string
  minutes: number
  color: string
}

function StatCell({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}): React.ReactElement {
  return (
    <div className="flex flex-col bg-background px-3 py-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
      </span>
    </div>
  )
}

/**
 * 프로그램의 주간 합계와 존 분포를 보여주는 패널.
 * 세션을 편집하는 즉시 갱신되어, 한 주를 조립하는 동안 총량과 강도 배분을 확인할 수 있다.
 */
export function ProgramSummaryPanel({ totals }: ProgramSummaryPanelProps): React.ReactElement {
  const bands: ZoneBand[] = [
    { label: '이지', minutes: totals.easyMinutes, color: 'var(--green)' },
    { label: '역치', minutes: totals.thresholdMinutes, color: 'var(--red)' },
    { label: 'Z3 초과', minutes: totals.supraMinutes, color: 'var(--purple)' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
        <StatCell label="계획 거리" value={totals.totalDistance.toFixed(1)} unit="km" />
        <StatCell label="계획 시간" value={formatMinutes(totals.totalMinutes)} />
        <StatCell label="예상 TSS" value={String(totals.estimatedTSS)} />
        <StatCell label="세션" value={`${totals.sessionCount}회 / ${totals.trainingDays}일`} />
      </div>

      <div className="rounded-lg border p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium">강도 분포</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            이지 {totals.easyPercent}%
          </span>
        </div>

        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
          {totals.totalMinutes > 0 &&
            bands.map((band) => (
              <div
                key={band.label}
                style={{
                  width: `${(band.minutes / totals.totalMinutes) * 100}%`,
                  backgroundColor: band.color,
                }}
              />
            ))}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {bands.map((band) => (
            <div key={band.label} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="inline-flex w-2 rounded-full aspect-square"
                style={{ backgroundColor: band.color }}
              />
              <span className="text-muted-foreground">{band.label}</span>
              <span className="ml-auto tabular-nums">{band.minutes}분</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
