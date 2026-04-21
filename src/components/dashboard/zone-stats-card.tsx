import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getZoneBoundaries } from '@/lib/hr-zones'
import { TermLabel } from './term-label'
import type { WeeklyZoneStats } from '@/types/pmc'

interface ZoneStatsCardProps {
  stats: WeeklyZoneStats
  /** 개인 LTHR (bpm). BPM 범위 표시용 */
  lthr: number
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const fmt = (d: Date): string => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

/**
 * 주간 HR Zone 통계 카드 (Bakken 3-Zone 기준).
 * intervals.icu 스타일의 행 기반 레이아웃으로 각 존의 시간과 비율을 표시합니다.
 */
export function ZoneStatsCard({ stats, lthr }: ZoneStatsCardProps): React.ReactElement {
  const bounds = getZoneBoundaries(lthr)
  const lt1 = bounds.z2.max
  const lt2 = bounds.z4.max

  const zones = [
    {
      key: 'easy',
      term: 'LT1 이하',
      bpm: `< ${lt1} bpm`,
      definition:
        'LT1(첫 번째 젖산 역치) 미만. 대화 가능한 편한 강도로, 볼륨 확보와 기초 체력 유지에 사용됩니다.',
      color: 'color-mix(in oklch, var(--color-blue) 80%, transparent)',
      seconds: stats.easySeconds,
      pct: stats.easyPct,
    },
    {
      key: 'threshold',
      term: 'LT1~LT2',
      bpm: `${lt1}~${lt2} bpm`,
      definition:
        'LT1과 LT2(두 번째 젖산 역치) 사이. Bakken 모델의 핵심 훈련 구간으로, 젖산 제거 능력 향상에 결정적입니다.',
      color: 'color-mix(in oklch, var(--color-blue) 90%, transparent)',
      seconds: stats.thresholdSeconds,
      pct: stats.thresholdPct,
    },
    {
      key: 'supra',
      term: 'LT2 초과',
      bpm: `> ${lt2} bpm`,
      definition: '1~5분 내외만 지속 가능한 고강도로, VO2max 및 최대 속도 훈련에 사용됩니다.',
      color: 'var(--color-blue)',
      seconds: stats.supraSeconds,
      pct: stats.supraPct,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>주간 HR Zone</CardTitle>
        <CardDescription>{formatDateRange(stats.startDate, stats.endDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.analyzedSessions < stats.totalSessions && (
          <div className="mb-3 rounded-md border border-orange/30 bg-orange/10 p-2 text-xs text-muted-foreground">
            분석된 세션: {stats.analyzedSessions}/{stats.totalSessions}회 (
            {formatTime(stats.totalSeconds)}/{formatTime(stats.totalWeekSeconds)}). 나머지 세션은
            LTHR 설정 이전에 분석되어 존 데이터가 없습니다.{' '}
            <code className="rounded bg-background/50 px-1">pnpm sync</code>로 재처리하세요.
          </div>
        )}
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.key} className="grid grid-cols-[9rem_1fr_5rem_3rem] items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <div className="text-sm font-medium">
                  <TermLabel term={z.term} definition={z.definition} />
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">{z.bpm}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background/50">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${z.pct}%`, backgroundColor: z.color }}
                />
              </div>
              <div className="text-right text-sm tabular-nums">{formatTime(z.seconds)}</div>
              <div className="text-right text-sm text-muted-foreground tabular-nums">{z.pct}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
