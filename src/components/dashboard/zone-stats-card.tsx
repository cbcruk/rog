import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyZoneStats } from '@/types/pmc'

interface ZoneStatsCardProps {
  stats: WeeklyZoneStats
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
export function ZoneStatsCard({ stats }: ZoneStatsCardProps): React.ReactElement {
  const zones = [
    {
      key: 'easy',
      label: '이지',
      color: 'color-mix(in oklch, var(--color-blue) 30%, transparent)',
      seconds: stats.easySeconds,
      pct: stats.easyPct,
    },
    {
      key: 'threshold',
      label: '역치',
      color: 'color-mix(in oklch, var(--color-blue) 60%, transparent)',
      seconds: stats.thresholdSeconds,
      pct: stats.thresholdPct,
    },
    {
      key: 'supra',
      label: 'VO2max',
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
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.key} className="grid grid-cols-[4rem_1fr_5rem_3rem] items-center gap-3">
              <div className="text-sm font-medium">{z.label}</div>
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
