'use client'

import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
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
    <div className="flex flex-col">
      <Text type="supporting" size="xsm" display="block">
        {label}
      </Text>
      <Text weight="semibold" hasTabularNumbers display="block">
        {value}
        {unit && (
          <Text type="supporting" size="sm">
            {' '}
            {unit}
          </Text>
        )}
      </Text>
    </div>
  )
}

/**
 * 프로그램의 주간 합계와 존 분포를 보여주는 패널.
 * 세션을 편집하는 즉시 갱신되어, 한 주를 조립하는 동안 총량과 강도 배분을 확인할 수 있다.
 */
export function ProgramSummaryPanel({ totals }: ProgramSummaryPanelProps): React.ReactElement {
  const bands: ZoneBand[] = [
    { label: '이지', minutes: totals.easyMinutes, color: 'var(--color-data-categorical-green)' },
    { label: '역치', minutes: totals.thresholdMinutes, color: 'var(--color-data-categorical-red)' },
    {
      label: 'Z3 초과',
      minutes: totals.supraMinutes,
      color: 'var(--color-data-categorical-purple)',
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <Card padding={3}>
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="계획 거리" value={totals.totalDistance.toFixed(1)} unit="km" />
          <StatCell label="계획 시간" value={formatMinutes(totals.totalMinutes)} />
          <StatCell label="예상 TSS" value={String(totals.estimatedTSS)} />
          <StatCell label="세션" value={`${totals.sessionCount}회 / ${totals.trainingDays}일`} />
        </div>
      </Card>

      <Card padding={3}>
        <div className="flex items-baseline justify-between gap-2">
          <Text type="label">강도 분포</Text>
          <Text type="supporting" hasTabularNumbers>
            이지 {totals.easyPercent}%
          </Text>
        </div>

        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-track">
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
            <div key={band.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-flex w-2 rounded-full aspect-square"
                style={{ backgroundColor: band.color }}
              />
              <Text type="supporting" size="sm">
                {band.label}
              </Text>
              <Text size="sm" hasTabularNumbers className="ml-auto">
                {band.minutes}분
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
