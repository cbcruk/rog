import { Card } from '@astryxdesign/core/Card'
import { Divider } from '@astryxdesign/core/Divider'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Text } from '@astryxdesign/core/Text'
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

/**
 * 달성률 구간별 ProgressBar 색.
 * 95% 이상이면 목표를 채운 것, 70% 미만이면 눈에 띄게 미달인 상태다.
 */
function getPercentVariant(percent: number): 'success' | 'warning' | 'neutral' {
  if (percent >= 95) return 'success'
  if (percent >= 70) return 'warning'
  return 'neutral'
}

function ProgressRow({
  label,
  actualText,
  plannedText,
  percent,
}: ProgressRowProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <Text type="supporting" size="xsm">
          {label}
        </Text>
        <Text size="sm" hasTabularNumbers>
          <Text weight="semibold" size="sm">
            {actualText}
          </Text>
          <Text color="secondary" size="sm">
            {' '}
            / {plannedText}
          </Text>
        </Text>
      </div>

      <ProgressBar
        label={`${label} 달성률`}
        isLabelHidden
        hasValueLabel
        value={percent === null ? 0 : Math.min(percent, 100)}
        formatValueLabel={() => (percent === null ? '—' : `${percent}%`)}
        variant={percent === null ? 'neutral' : getPercentVariant(percent)}
      />
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Text type="supporting" size="xsm">
        {label}
      </Text>
      <Text size="sm" hasTabularNumbers>
        {value}
      </Text>
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
      <Card padding={3}>
        <Text type="supporting" display="block">
          적용 중인 프로그램이 없어 비교할 기준이 없습니다. 프로그램 화면에서 &ldquo;현재
          적용&rdquo;을 체크해 저장하세요.
        </Text>
        <Divider />
        <div className="flex flex-col gap-1">
          <StatRow label="실제 거리" value={`${actual.distance.toFixed(1)}km`} />
          <StatRow label="실제 시간" value={formatMinutes(actual.minutes)} />
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Card padding={3}>
        <Text type="label">계획 대비 달성률</Text>
        <Divider />
        <div className="flex flex-col gap-3">
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
      </Card>

      <Card padding={3}>
        <div className="flex flex-col gap-1">
          <StatRow label="미실시" value={`${missedCount}회`} />
          <StatRow label="계획 외" value={`${unplannedCount}회`} />
          <StatRow
            label="Z3 초과"
            value={
              <>
                {actual.supraMinutes}분
                <Text color="secondary" size="sm">
                  {' '}
                  / {planned.supraMinutes}분
                </Text>
              </>
            }
          />
        </div>
      </Card>
    </div>
  )
}
